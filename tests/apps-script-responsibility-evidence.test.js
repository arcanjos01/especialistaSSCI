const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {};
vm.createContext(context);
for (const relativePath of [
  '../apps-script/CompiledRuntimeContract.js',
  '../apps-script/EngineCore.js',
  '../apps-script/RdeCore.js',
  '../apps-script/ExecutionViewCore.js',
  '../apps-script/CurrentSubmissionContextCore.js',
  '../apps-script/CbmscApplicabilityCore.js',
  '../apps-script/ExecutionPlanCore.js',
  '../apps-script/ResponsibilityEvidenceCore.js'
]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, relativePath), 'utf8'), context);
}
vm.runInContext(`globalThis.api = {
  COMPILED_RUNTIME_CONTRACT,
  TypedReference,
  createCurrentSubmissionContext,
  projectRdeToExecutionView_,
  resolveCbmscApplicability,
  materializeFrozenExecutionPlan,
  resolvedRequiredTechnicalResponsibilities,
  materializeResponsibilityEvidenceBinding,
  isCanonicalResponsibilityEvidenceBinding,
  ResponsibilityEvidenceIntegrityError
};`, context);
const api = context.api;
const contract = api.COMPILED_RUNTIME_CONTRACT;

for (const name of [
  'resolvedRequiredTechnicalResponsibilities',
  'materializeResponsibilityEvidenceBinding',
  'isCanonicalResponsibilityEvidenceBinding'
]) {
  const descriptor = vm.runInContext(
    "Object.getOwnPropertyDescriptor(globalThis, " + JSON.stringify(name) + ")", context
  );
  assert.equal(descriptor.writable, false, name);
  assert.equal(descriptor.configurable, false, name);
}
assert.equal(vm.runInContext("typeof responsibilityRequire_", context), 'undefined');
assert.equal(vm.runInContext("typeof responsibilityFreezeCopy_", context), 'undefined');

assert.throws(
  () => vm.runInContext('EXECUTION_VIEW_RECORDS', context),
  /not defined/
);
assert.throws(
  () => vm.runInContext('executionViewRecords_', context),
  /not defined/
);
assert.throws(
  () => vm.runInContext('executionViewStateSet_', context),
  /not defined/
);

assert.equal(
  vm.runInContext("Object.isFrozen(ImmutableExecutionView.prototype)", context),
  true
);
for (const methodName of [
  'contains', 'read', 'entityId', 'sourceDocument', 'referencesByEntity', 'provenance'
]) {
  const descriptor = vm.runInContext(
    "Object.getOwnPropertyDescriptor(ImmutableExecutionView.prototype, " +
      JSON.stringify(methodName) + ")",
    context
  );
  assert.equal(descriptor.writable, false, methodName);
  assert.equal(descriptor.configurable, false, methodName);
}
const snapshotDescriptor = vm.runInContext(
  "Object.getOwnPropertyDescriptor(globalThis, 'snapshotImmutableExecutionViewEntityRecords')",
  context
);
assert.equal(typeof snapshotDescriptor.value, 'function');
assert.equal(snapshotDescriptor.writable, false);
assert.equal(snapshotDescriptor.configurable, false);
assert.equal(
  vm.runInContext(
    "Reflect.set(ImmutableExecutionView.prototype, 'referencesByEntity', function(){ return []; })",
    context
  ),
  false
);

function currentContext() {
  return api.createCurrentSubmissionContext({
    protocolIdentifier: 'TEST_ONLY_PROTOCOL',
    requestDate: '2026-01-28',
    reIdentifier: 'TEST_ONLY_RE',
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_INTAKE' }
  });
}

function makeRde(codes = [], drts = []) {
  const records = [{
    record_id: 'DOC_CURRENT',
    entity_id: 'COMPROVANTE_DE_SOLICITACAO_DE_HABITESE',
    parent_record_id: null,
    source_document: 'DOC_CURRENT',
    attributes: {
      PROTOCOL_IDENTIFIER: 'TEST_ONLY_PROTOCOL',
      REQUEST_DATE: '2026-01-28',
      RE_IDENTIFIER: 'TEST_ONLY_RE'
    },
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'CURRENT' }
  }, {
    record_id: 'SECTION_CURRENT',
    entity_id: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA',
    parent_record_id: 'DOC_CURRENT',
    source_document: 'DOC_CURRENT',
    attributes: { STRUCTURALLY_COMPLETE: true, LEGIBLE: true, VERIFIABLE: true },
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'SECTION' }
  }];

  codes.forEach((code, index) => records.push({
    record_id: 'ITEM_' + index,
    entity_id: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA_ITEM',
    parent_record_id: 'SECTION_CURRENT',
    source_document: 'DOC_CURRENT',
    attributes: {
      OFFICIAL_ESCI_CODE: code,
      PRESENTED_SYSTEM_MEASURE_DESCRIPTION: 'TEST ' + code,
      RPCI_ORIENTATIVE_TEXT: 'TEST',
      SOURCE_LOCATION: 'TEST ' + index
    },
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'ITEM_' + index }
  }));

  drts.forEach((drt, index) => records.push({
    record_id: 'DRT_' + index,
    entity_id: drt.entityId,
    parent_record_id: null,
    source_document: 'DRT_' + index,
    attributes: drt.attributes,
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'DRT_' + index }
  }));

  return {
    schema_version: '0.2.0',
    process_id: 'TEST_ONLY_PROCESS',
    source: {
      file_id: 'TEST_ONLY_FILE',
      file_name: 'TEST_ONLY.pdf',
      mime_type: 'application/pdf',
      source_url: 'TEST_ONLY_URL',
      sha256: '0'.repeat(64)
    },
    extraction: {
      provider: 'TEST_ONLY',
      extractor_version: 'TEST_ONLY',
      created_at: '2026-10-08T12:00:00.000Z'
    },
    records,
    extraction_warnings: []
  };
}

function prepare(codes = [], drts = []) {
  const rde = makeRde(codes, drts);
  const view = api.projectRdeToExecutionView_(rde, contract.entityCatalog);
  const resolution = api.resolveCbmscApplicability(view, currentContext(), contract);
  const plan = api.materializeFrozenExecutionPlan(contract, resolution, view);
  return { rde, view, resolution, plan };
}

for (const entityId of ['ART', 'RRT', 'TRT']) {
  const declarationRde = makeRde([], [{
    entityId,
    attributes: { RESPONSIBILITY_TYPE: 'EXECUCAO' }
  }]);
  declarationRde.schema_version = '0.4.0';
  declarationRde.documentary_associations = [];
  declarationRde.drt_declaration_items = [{
    declaration_id: 'DECL_' + entityId,
    drt_record_id: 'DRT_0',
    activity_service_text: 'execução',
    smsci_scope_text: 'sistema de hidrantes',
    source_document: 'DRT_0',
    source_text: 'Atividade: execução; sistema: sistema de hidrantes.'
  }];
  const declarationView = api.projectRdeToExecutionView_(
    declarationRde, contract.entityCatalog
  );
  const declarationRef = new api.TypedReference('DOCUMENT', 'DRT_0');
  const items = declarationView.drtDeclarationItems(declarationRef);
  assert.equal(items.length, 1, entityId);
  assert.equal(items[0].drt.kind, 'DOCUMENT', entityId);
  assert.equal(items[0].sourceDocument.identifier, 'DRT_0', entityId);
  assert.equal(Object.isFrozen(items), true, entityId);
}

const base = prepare([], [
  {
    entityId: 'ART',
    attributes: {
      RESPONSIBILITY_TYPE: 'EXECUCAO',
      COUNCIL_STATE: 'SC',
      COUNCIL_REGISTRATION_STATUS: 'registrada'
    }
  },
  { entityId: 'RRT', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' } },
  { entityId: 'TRT', attributes: { RESPONSIBILITY_TYPE: 'EXECUCAO' } }
]);
const domain = api.resolvedRequiredTechnicalResponsibilities(contract, base.plan, base.view);
assert.equal(Object.isFrozen(domain), true);
assert.equal(domain[0].catalogIdentifier, 'RT-002');
assert.equal(domain[0].responsibilityId, 'RT_002_EXECUCAO_DE_OBRA');
assert.equal(domain[0].documentaryResponsibilityType, 'EXECUCAO');
assert.deepEqual(JSON.parse(JSON.stringify(domain[0].requirementIds)), [
  'REQ_T1_DRT_REQUIRED',
  'REQ_T1_DRT_ACTIVITY_EXECUTION',
  'REQ_T1_CONFORMITY_REPORT',
  'REQ_T1_CONFORMITY_REPORT_SIGNED'
]);
assert.equal(domain.some(item => item.catalogIdentifier === 'RT-003'), false);

const binding = api.materializeResponsibilityEvidenceBinding(
  contract, base.plan, base.view, 'RT-002'
);
assert.equal(Object.isFrozen(binding), true);
assert.equal(Object.isFrozen(binding.evidence), true);
assert.equal(binding.evidence.length, 2);
assert.deepEqual(JSON.parse(JSON.stringify(binding.evidence.map(item => item.entityId))), ['ART', 'TRT']);
assert.deepEqual(JSON.parse(JSON.stringify(binding.evidence.map(item => item.selectionFact.value))), ['EXECUCAO', 'EXECUCAO']);
assert.equal(binding.evidence.every(item => item.reference.kind === 'DOCUMENT'), true);
assert.equal(binding.evidence.every(item => item.sourceDocument.kind === 'DOCUMENT'), true);
assert.equal(api.isCanonicalResponsibilityEvidenceBinding(
  binding, contract, base.plan, base.view
), true);

for (const helperName of [
  'executionReferenceKey',
  'copyImmutableExecutionReference',
  'hasNativeExecutionNonJsonBrand',
  'isPlainExecutionObject',
  'immutableExecutionCopy',
  'assertStrictExecutionJsonValue'
]) {
  assert.throws(
    () => vm.runInContext(helperName, context),
    /not defined/,
    helperName
  );
}

const sourcePreservationRde = makeRde([], [{
  entityId: 'ART',
  attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
try {
  vm.runInContext(`
    globalThis.executionReferenceKey = function () { return 'FORGED_KEY'; };
    globalThis.copyImmutableExecutionReference = function () {
      throw new Error('forged reference copy must not run');
    };
    globalThis.hasNativeExecutionNonJsonBrand = function () { return false; };
    globalThis.isPlainExecutionObject = function () { return true; };
    globalThis.assertStrictExecutionJsonValue = function () {};
    globalThis.immutableExecutionCopy = function (value) {
      if (value && typeof value === 'object' &&
          value.RESPONSIBILITY_TYPE === 'VISTORIA_ENSAIO') {
        return Object.freeze({ RESPONSIBILITY_TYPE: 'EXECUCAO' });
      }
      return value;
    };
  `, context);

  const sourcePreservationView = api.projectRdeToExecutionView_(
    sourcePreservationRde, contract.entityCatalog
  );
  const forgedProjectionEntries = [];
  for (const entityId of Object.keys(contract.entityCatalog)) {
    for (const reference of sourcePreservationView.referencesByEntity(entityId)) {
      const parent = sourcePreservationView.parent(reference);
      const sourceDocument = sourcePreservationView.sourceDocument(reference);
      const entry = {
        reference: new api.TypedReference(reference.kind, reference.identifier),
        entityId,
        parent: parent ? new api.TypedReference(parent.kind, parent.identifier) : null,
        sourceDocument: new api.TypedReference(sourceDocument.kind, sourceDocument.identifier),
        value: JSON.parse(JSON.stringify(sourcePreservationView.read(reference)))
      };
      const provenance = sourcePreservationView.provenance(reference);
      if (provenance !== undefined) entry.provenance = JSON.parse(JSON.stringify(provenance));
      forgedProjectionEntries.push(entry);
    }
  }
  forgedProjectionEntries.find(entry => entry.entityId === 'ART').value.RESPONSIBILITY_TYPE =
    'EXECUCAO';
  assert.throws(
    () => new (vm.runInContext('ImmutableExecutionView', context))(
      forgedProjectionEntries, [], '0.2.0'
    ),
    /only be created from an RDE projection/
  );

  const sourcePreservationSnapshot = snapshotDescriptor.value(
    sourcePreservationView, 'ART'
  );
  assert.equal(sourcePreservationSnapshot.length, 1);
  assert.equal(
    sourcePreservationSnapshot[0].value.RESPONSIBILITY_TYPE,
    'VISTORIA_ENSAIO'
  );

  const sourcePreservationResolution = api.resolveCbmscApplicability(
    sourcePreservationView, currentContext(), contract
  );
  const sourcePreservationPlan = api.materializeFrozenExecutionPlan(
    contract, sourcePreservationResolution, sourcePreservationView
  );
  const sourcePreservationBinding = api.materializeResponsibilityEvidenceBinding(
    contract, sourcePreservationPlan, sourcePreservationView, 'RT-002'
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(sourcePreservationBinding.evidence)),
    []
  );
  assert.equal(
    api.isCanonicalResponsibilityEvidenceBinding(
      sourcePreservationBinding,
      contract,
      sourcePreservationPlan,
      sourcePreservationView
    ),
    true
  );
} finally {
  vm.runInContext(`
    delete globalThis.executionReferenceKey;
    delete globalThis.copyImmutableExecutionReference;
    delete globalThis.hasNativeExecutionNonJsonBrand;
    delete globalThis.isPlainExecutionObject;
    delete globalThis.assertStrictExecutionJsonValue;
    delete globalThis.immutableExecutionCopy;
  `, context);
}

function assertNoRt002ForRde(rde, attackName) {
  const view = api.projectRdeToExecutionView_(rde, contract.entityCatalog);
  const snapshot = snapshotDescriptor.value(view, 'ART');
  assert.equal(snapshot.length, 1, attackName);
  assert.equal(snapshot[0].value.RESPONSIBILITY_TYPE, 'VISTORIA_ENSAIO', attackName);
  const resolution = api.resolveCbmscApplicability(view, currentContext(), contract);
  const plan = api.materializeFrozenExecutionPlan(contract, resolution, view);
  const result = api.materializeResponsibilityEvidenceBinding(
    contract, plan, view, 'RT-002'
  );
  assert.deepEqual(JSON.parse(JSON.stringify(result.evidence)), [], attackName);
  assert.equal(api.isCanonicalResponsibilityEvidenceBinding(result, contract, plan, view), true);
}

const descriptorAttackRde = makeRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
const nativeGetOwnPropertyDescriptor = vm.runInContext(
  'Object.getOwnPropertyDescriptor', context
);
context.__descriptorAttackRde = descriptorAttackRde;
context.__nativeGetOwnPropertyDescriptor = nativeGetOwnPropertyDescriptor;
try {
  vm.runInContext(`
    const artIndex = __descriptorAttackRde.records.findIndex(record => record.entity_id === 'ART');
    Object.getOwnPropertyDescriptor = function (object, key) {
      if (object === __descriptorAttackRde.records && key === String(artIndex)) {
        const record = __nativeGetOwnPropertyDescriptor(object, key).value;
        return {
          value: { ...record, attributes: { RESPONSIBILITY_TYPE: 'EXECUCAO' } },
          writable: true, enumerable: true, configurable: true
        };
      }
      return __nativeGetOwnPropertyDescriptor(object, key);
    };
  `, context);
  assertNoRt002ForRde(descriptorAttackRde, 'patched Object.getOwnPropertyDescriptor');
} finally {
  vm.runInContext('Object.getOwnPropertyDescriptor = __nativeGetOwnPropertyDescriptor;', context);
  delete context.__descriptorAttackRde;
  delete context.__nativeGetOwnPropertyDescriptor;
}

const pushAttackRde = makeRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
context.__pushAttackRde = pushAttackRde;
vm.runInContext('globalThis.__nativeArrayPush = Array.prototype.push;', context);
try {
  vm.runInContext(`
    const nativePush = Array.prototype.push;
    Array.prototype.push = function (entry) {
      if (entry && entry.entityId === 'ART' && entry.value) {
        entry.value.RESPONSIBILITY_TYPE = 'EXECUCAO';
      }
      return nativePush.apply(this, arguments);
    };
  `, context);
  assertNoRt002ForRde(pushAttackRde, 'patched Array.prototype.push');
} finally {
  vm.runInContext('Array.prototype.push = __nativeArrayPush;', context);
  delete context.__pushAttackRde;
  delete context.__nativeArrayPush;
}

const freezeAttackRde = makeRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
context.__nativeObjectFreeze = vm.runInContext('Object.freeze', context);
try {
  vm.runInContext('Object.freeze = function (value) { return value; };', context);
  const freezeAttackView = api.projectRdeToExecutionView_(
    freezeAttackRde, contract.entityCatalog
  );
  const artReference = freezeAttackView.referencesByEntity('ART')[0];
  assert.equal(Object.isFrozen(artReference), true);
  assert.equal(Reflect.set(artReference, 'identifier', 'FORGED_DOCUMENT'), false);
  assert.equal(freezeAttackView.referencesByEntity('ART')[0].identifier, 'DRT_0');
} finally {
  vm.runInContext('Object.freeze = __nativeObjectFreeze;', context);
  delete context.__nativeObjectFreeze;
}
assertNoRt002ForRde(freezeAttackRde, 'patched Object.freeze');

const originalWeakMapGet = vm.runInContext('WeakMap.prototype.get', context);
context.__originalWeakMapGet = originalWeakMapGet;
try {
  vm.runInContext(`
    WeakMap.prototype.get = function () {
      throw new Error('forged WeakMap.prototype.get must not be consulted');
    };
  `, context);
  const snapshotWithForgedWeakMapPrototype = snapshotDescriptor.value(base.view, 'ART');
  assert.equal(snapshotWithForgedWeakMapPrototype.length, 1);
  assert.equal(snapshotWithForgedWeakMapPrototype[0].entityId, 'ART');
} finally {
  vm.runInContext('WeakMap.prototype.get = __originalWeakMapGet', context);
  delete context.__originalWeakMapGet;
}

const missing = prepare([], [
  { entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' } }
]);
const missingBinding = api.materializeResponsibilityEvidenceBinding(
  contract, missing.plan, missing.view, 'RT-002'
);
assert.deepEqual(JSON.parse(JSON.stringify(missingBinding.evidence)), []);
assert.equal('result' in missingBinding, false);
assert.equal('engineResult' in missingBinding, false);
assert.equal('pipelineResult' in missingBinding, false);
assert.equal(api.resolvedRequiredTechnicalResponsibilities(
  contract, missing.plan, missing.view
).some(item => item.catalogIdentifier === 'RT-003'), false);

const pressurization = prepare(['SPDE']);
const pressDomain = api.resolvedRequiredTechnicalResponsibilities(
  contract, pressurization.plan, pressurization.view
);
assert.equal(pressDomain.some(item => item.catalogIdentifier === 'RT-003'), true);
assert.equal(pressDomain.some(item => item.catalogIdentifier === 'RT-005'), true);
assert.equal(pressDomain.some(item => item.catalogIdentifier === 'RT-006'), true);
assert.equal(pressDomain.some(item => item.catalogIdentifier === 'RT-015'), false);

const cmar = prepare(['CMAR']);
const cmarDomain = api.resolvedRequiredTechnicalResponsibilities(
  contract, cmar.plan, cmar.view
);
assert.equal(cmarDomain.some(item => item.catalogIdentifier === 'RT-007'), false);

assert.throws(() => api.materializeResponsibilityEvidenceBinding(
  contract, pressurization.plan, pressurization.view, 'RT-003'
), error => error && error.code === 'RESPONSIBILITY_EVIDENCE_INTEGRITY_ERROR');

const equivalent = prepare([], [
  { entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'EXECUCAO' } }
]);
assert.equal(api.isCanonicalResponsibilityEvidenceBinding(
  binding, contract, equivalent.plan, equivalent.view
), false);
const cloned = Object.freeze(JSON.parse(JSON.stringify(binding)));
assert.equal(api.isCanonicalResponsibilityEvidenceBinding(
  cloned, contract, base.plan, base.view
), false);

base.rde.records.find(item => item.record_id === 'DRT_0').attributes.RESPONSIBILITY_TYPE =
  'VISTORIA_ENSAIO';
assert.equal(binding.evidence.length, 2);
assert.deepEqual(JSON.parse(JSON.stringify(binding.evidence.map(item => item.selectionFact.value))), ['EXECUCAO', 'EXECUCAO']);

console.log('apps-script-responsibility-evidence: PASS');
