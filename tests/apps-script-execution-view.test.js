const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {};
vm.createContext(context);
for (const relativePath of [
  '../apps-script/RdeCore.js',
  '../apps-script/EngineCore.js',
  '../apps-script/ExecutionViewCore.js'
]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, relativePath), 'utf8'), context);
}
vm.runInContext(`
globalThis.testApi = {
  RDE_SCHEMA_VERSION,
  validateRdeStructure_,
  EngineResult,
  ArgumentKind,
  TypedReference,
  ArgumentSpec,
  ArgumentSchema,
  PredicateContract,
  PredicateRegistry,
  PredicateCall,
  CriterionIR,
  evaluateCriterion,
  ImmutableExecutionView
};`, context);

const api = context.testApi;
const fixtureRde = {
  schema_version: '0.1.0',
  process_id: 'TEST_ONLY_PROCESS',
  source: {
    file_id: 'TEST_ONLY_FILE',
    file_name: 'TEST_ONLY_SOURCE.pdf',
    mime_type: 'application/pdf',
    source_url: 'https://example.invalid/TEST_ONLY_SOURCE',
    sha256: '0'.repeat(64)
  },
  extraction: {
    provider: 'TEST_ONLY',
    extractor_version: 'TEST_ONLY',
    created_at: '2026-10-06T12:00:00.000Z'
  },
  document: { document_type: 'TEST_ONLY' },
  facts: {
    test_entity: {
      value: { label: 'TEST_ONLY entity-1', nested: { enabled: true } },
      source_document: 'TEST_ONLY_SOURCE.pdf'
    },
    values: {
      null_value: { value: null, source_document: 'TEST_ONLY_SOURCE.pdf' },
      false_value: { value: false, source_document: 'TEST_ONLY_SOURCE.pdf' },
      zero_value: { value: 0, source_document: 'TEST_ONLY_SOURCE.pdf' },
      empty_string: { value: '', source_document: 'TEST_ONLY_SOURCE.pdf' },
      empty_array: { value: [], source_document: 'TEST_ONLY_SOURCE.pdf' },
      empty_object: { value: {}, source_document: 'TEST_ONLY_SOURCE.pdf' },
      nested_array: {
        value: [{ label: 'TEST_ONLY nested', values: [0, false, ''] }],
        source_document: 'TEST_ONLY_SOURCE.pdf'
      },
      provenance_missing: { value: 'TEST_ONLY provenance unavailable' }
    }
  },
  evidence: [{ marker: 'TEST_ONLY_EVIDENCE', source_document: 'TEST_ONLY_SOURCE.pdf' }],
  extraction_warnings: []
};
const originalRdeJson = JSON.stringify(fixtureRde);
const validatedRde = api.validateRdeStructure_(fixtureRde, {
  processId: 'TEST_ONLY_PROCESS', sourceFileId: 'TEST_ONLY_FILE'
});
assert.equal(validatedRde, fixtureRde);
assert.equal(JSON.stringify(fixtureRde), originalRdeJson);

// This explicit TEST_ONLY projection is test scaffolding, not a mapping rule for RDE facts.
const refs = {
  entity: new api.TypedReference('TEST_ENTITY', 'entity-1'),
  nullValue: new api.TypedReference('TEST_VALUE', 'null'),
  falseValue: new api.TypedReference('TEST_VALUE', 'false'),
  zeroValue: new api.TypedReference('TEST_VALUE', 'zero'),
  emptyString: new api.TypedReference('TEST_VALUE', 'empty-string'),
  emptyArray: new api.TypedReference('TEST_VALUE', 'empty-array'),
  emptyObject: new api.TypedReference('TEST_VALUE', 'empty-object'),
  nestedArray: new api.TypedReference('TEST_VALUE', 'nested-array'),
  provenanceMissing: new api.TypedReference('TEST_VALUE', 'provenance-missing'),
  provenanceNull: new api.TypedReference('TEST_VALUE', 'provenance-null'),
  sameValueOtherReference: new api.TypedReference('TEST_VALUE_ALIAS', 'null-copy'),
  evidence: new api.TypedReference('TEST_EVIDENCE', 'evidence-1'),
  missing: new api.TypedReference('TEST_VALUE', 'missing')
};

function testOnlyProjection(rde) {
  const source = rde.source.file_name;
  const evidenceRecord = rde.evidence[0];
  return [
    { reference: refs.entity, value: rde.facts.test_entity.value,
      provenance: { source_document: rde.facts.test_entity.source_document,
        evidence_record: evidenceRecord } },
    ...Object.entries({
      nullValue: 'null_value', falseValue: 'false_value', zeroValue: 'zero_value',
      emptyString: 'empty_string', emptyArray: 'empty_array', emptyObject: 'empty_object',
      nestedArray: 'nested_array'
    }).map(([refName, factName]) => ({
      reference: refs[refName], value: rde.facts.values[factName].value,
      provenance: { source_document: rde.facts.values[factName].source_document }
    })),
    { reference: refs.provenanceMissing,
      value: rde.facts.values.provenance_missing.value },
    { reference: refs.provenanceNull, value: rde.facts.values.null_value.value,
      provenance: null },
    { reference: refs.sameValueOtherReference,
      value: rde.facts.values.null_value.value,
      provenance: { source_document: rde.facts.values.null_value.source_document } },
    { reference: refs.evidence, value: evidenceRecord.marker,
      provenance: { source_document: evidenceRecord.source_document,
        record: evidenceRecord } },
    { reference: new api.TypedReference('TEST_VALUE', 'rde-source-file'), value: source }
  ];
}

const projection = testOnlyProjection(validatedRde);
const originalProjectionJson = JSON.stringify(projection);
const view = new api.ImmutableExecutionView(projection);
assert.equal(JSON.stringify(projection), originalProjectionJson);
assert.equal(JSON.stringify(validatedRde), originalRdeJson);
assert.equal(Object.isFrozen(view), true);
assert.equal(Object.keys(view).length, 0);
for (const forbidden of [
  'getRawRde', 'raw', 'document', 'sourceDocument', 'arbitraryPath', 'evalPath'
]) assert.equal(view[forbidden], undefined);

assert.equal(view.contains(refs.entity), true);
assert.equal(view.contains(new api.TypedReference('TEST_ENTITY', 'entity-1')), true);
assert.equal(view.contains(refs.missing), false);
assert.equal(view.read(refs.nullValue), null);
assert.equal(view.read(refs.falseValue), false);
assert.equal(view.read(refs.zeroValue), 0);
assert.equal(view.read(refs.emptyString), '');
assert.deepEqual(JSON.parse(JSON.stringify(view.read(refs.emptyArray))), []);
assert.deepEqual(JSON.parse(JSON.stringify(view.read(refs.emptyObject))), {});
assert.equal(view.contains(refs.emptyArray), true);
assert.equal(view.contains(refs.emptyObject), true);
const nestedArray = view.read(refs.nestedArray);
assert.equal(Object.isFrozen(nestedArray), true);
assert.equal(Object.isFrozen(nestedArray[0]), true);
assert.equal(Object.isFrozen(nestedArray[0].values), true);
assert.equal(Reflect.set(nestedArray[0], 'label', 'MUTATED'), false);
assert.equal(view.contains(refs.nullValue), true);
assert.equal(view.contains(refs.falseValue), true);
assert.equal(view.contains(refs.zeroValue), true);
assert.equal(view.contains(refs.emptyString), true);
assert.equal(view.contains(refs.missing), false);
for (const presentRef of [refs.nullValue, refs.falseValue, refs.zeroValue, refs.emptyString]) {
  assert.notEqual(view.contains(refs.missing), view.contains(presentRef));
}
assert.throws(() => view.read(refs.missing), /reference not found/);
assert.throws(() => view.provenance(refs.missing), /reference not found/);

const originalReturned = view.read(refs.entity);
assert.notEqual(originalReturned, view.read(refs.entity));
assert.equal(Object.isFrozen(originalReturned), true);
assert.equal(Object.isFrozen(originalReturned.nested), true);
assert.equal(Reflect.set(originalReturned, 'label', 'MUTATED'), false);
assert.equal(Reflect.set(originalReturned.nested, 'enabled', false), false);
const originalArray = view.read(refs.emptyArray);
assert.equal(Object.isFrozen(originalArray), true);
assert.equal(Reflect.set(originalArray, '0', 'MUTATED'), false);

const provenance = view.provenance(refs.entity);
assert.deepEqual(JSON.parse(JSON.stringify(provenance)), {
  source_document: 'TEST_ONLY_SOURCE.pdf',
  evidence_record: { marker: 'TEST_ONLY_EVIDENCE', source_document: 'TEST_ONLY_SOURCE.pdf' }
});
assert.equal(Object.isFrozen(provenance), true);
assert.equal(Object.isFrozen(provenance.evidence_record), true);
assert.equal(view.provenance(refs.provenanceMissing), undefined);
assert.equal(view.provenance(refs.provenanceNull), null);
assert.equal(view.contains(refs.provenanceMissing), true);
assert.equal(view.contains(refs.provenanceNull), true);
assert.equal(view.read(refs.sameValueOtherReference), null);
assert.equal(view.contains(refs.sameValueOtherReference), true);
assert.notEqual(
  JSON.stringify([refs.nullValue.kind, refs.nullValue.identifier]),
  JSON.stringify([refs.sameValueOtherReference.kind, refs.sameValueOtherReference.identifier])
);
assert.equal(view.provenance(refs.nullValue).source_document, 'TEST_ONLY_SOURCE.pdf');

const orderedEntries = testOnlyProjection(validatedRde);
const reversedView = new api.ImmutableExecutionView(orderedEntries.slice().reverse());
const equivalentView = new api.ImmutableExecutionView(testOnlyProjection(validatedRde));
const logicalSnapshot = candidate => Object.keys(refs).sort().map(name => {
  const reference = refs[name];
  if (!candidate.contains(reference)) return [name, false];
  return [name, true, candidate.read(reference), candidate.provenance(reference)];
});
assert.deepEqual(JSON.parse(JSON.stringify(logicalSnapshot(reversedView))),
  JSON.parse(JSON.stringify(logicalSnapshot(equivalentView))));

// Mutating the original RDE and projection after construction cannot alter the view.
validatedRde.facts.test_entity.value.nested.enabled = false;
validatedRde.facts.values.false_value.value = true;
validatedRde.evidence[0].marker = 'MUTATED_EVIDENCE';
projection[0].value.label = 'MUTATED_PROJECTION';
assert.equal(view.read(refs.entity).nested.enabled, true);
assert.equal(view.read(refs.entity).label, 'TEST_ONLY entity-1');
assert.equal(view.read(refs.falseValue), false);
assert.equal(view.provenance(refs.evidence).record.marker, 'TEST_ONLY_EVIDENCE');
assert.equal(view.provenance(refs.entity).evidence_record.marker, 'TEST_ONLY_EVIDENCE');

assert.throws(() => new api.ImmutableExecutionView([
  { reference: refs.entity, value: 1 },
  { reference: new api.TypedReference('TEST_ENTITY', 'entity-1'), value: 2 }
]), /duplicate reference/);
assert.throws(() => new api.ImmutableExecutionView([
  { reference: { kind: 'TEST_ENTITY', identifier: 'fake' }, value: 1 }
]), /TypedReference/);
assert.throws(() => view.contains({ kind: 'TEST_ENTITY', identifier: 'entity-1' }), /TypedReference/);
assert.throws(() => new api.TypedReference('', 'malformed'), /reference kind/);
const cyclic = [];
cyclic.push(cyclic);
assert.throws(() => new api.ImmutableExecutionView([
  { reference: new api.TypedReference('TEST_VALUE', 'cycle'), value: cyclic }
]), /cyclic projection values/);
const cyclicObject = { nested: {} };
cyclicObject.nested.parent = cyclicObject;
assert.throws(() => new api.ImmutableExecutionView([
  { reference: new api.TypedReference('TEST_VALUE', 'object-cycle'), value: cyclicObject }
]), /cyclic projection values/);
assert.throws(() => new api.ImmutableExecutionView([
  { reference: new api.TypedReference('TEST_VALUE', 'provenance-cycle'),
    value: 'TEST_ONLY', provenance: cyclicObject }
]), /cyclic projection values/);

let resolverView;
const resolver = {
  resolve(_arguments, processMemory) {
    resolverView = processMemory;
    const present = processMemory.contains(refs.falseValue);
    const value = processMemory.read(refs.falseValue);
    const origin = processMemory.provenance(refs.falseValue);
    const evidencePresent = processMemory.contains(refs.evidence);
    return {
      result: present && value === false && evidencePresent && origin.source_document === 'TEST_ONLY_SOURCE.pdf'
        ? api.EngineResult.TRUE : api.EngineResult.FALSE,
      memoryReferences: [refs.falseValue, refs.evidence]
    };
  }
};
const registry = new api.PredicateRegistry([new api.PredicateContract({
  predicateId: 'TEST_ONLY_VIEW_LOOKUP',
  argumentSchema: new api.ArgumentSchema([
    new api.ArgumentSpec({ name: 'target', kind: api.ArgumentKind.REFERENCE })
  ]),
  resultContract: [api.EngineResult.TRUE, api.EngineResult.FALSE],
  resolver
})]);
const criterion = new api.CriterionIR({
  criterionId: 'TEST_ONLY_CRITERION',
  requirementId: 'TEST_ONLY_REQUIREMENT',
  expression: new api.PredicateCall('TEST_ONLY_VIEW_LOOKUP', { target: refs.falseValue }),
  expectedResult: api.EngineResult.TRUE,
  traceability: { declarationSource: 'TEST_ONLY' }
});
const firstEvaluation = api.evaluateCriterion(criterion, registry, view);
const secondEvaluation = api.evaluateCriterion(criterion, registry, view);
assert.equal(resolverView, view);
assert.equal(firstEvaluation.engineResult, api.EngineResult.TRUE);
assert.equal(firstEvaluation.pipelineResult, 'PASS');
assert.equal(firstEvaluation.trace[0].predicateId, 'TEST_ONLY_VIEW_LOOKUP');
assert.deepEqual(JSON.parse(JSON.stringify(firstEvaluation.trace[0].memoryReferences)), [
  { kind: 'TEST_VALUE', identifier: 'false' },
  { kind: 'TEST_EVIDENCE', identifier: 'evidence-1' }
]);
assert.deepEqual(JSON.parse(JSON.stringify(firstEvaluation)), JSON.parse(JSON.stringify(secondEvaluation)));
assert.equal(Object.isFrozen(firstEvaluation.trace[0].memoryReferences), true);

assert.equal(typeof context.DriveApp, 'undefined');
assert.equal(typeof context.SpreadsheetApp, 'undefined');
assert.equal(typeof context.PropertiesService, 'undefined');
assert.equal(typeof context.UrlFetchApp, 'undefined');
assert.equal(typeof context.Gemini, 'undefined');
for (const noGoogleReference of [
  'DriveApp', 'SpreadsheetApp', 'PropertiesService', 'UrlFetchApp', 'Gemini'
]) assert.equal(fs.readFileSync(path.join(__dirname, '../apps-script/ExecutionViewCore.js'), 'utf8').includes(noGoogleReference), false);
assert.equal(/\b(?:Requirement|Criterion|Nonconformity|SMSCI|applicability)\b/.test(
  fs.readFileSync(path.join(__dirname, '../apps-script/ExecutionViewCore.js'), 'utf8')
), false);

console.log('apps-script-execution-view: PASS');
