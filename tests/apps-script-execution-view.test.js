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
  ImmutableExecutionView,
  projectRdeToExecutionView_
};`, context);

const api = context.testApi;
const fixtureRde = {
  schema_version: '0.3.0',
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
  records: [],
  extraction_warnings: []
};
const entityCatalog = {
  TEST_DOCUMENT: {
    TYPE: 'DOCUMENT', ATTRIBUTES: ['REQUEST_IDENTIFIER', 'PROTOCOL_IDENTIFIER'],
    ATTRIBUTE_TYPES: { REQUEST_IDENTIFIER: 'TEXT', PROTOCOL_IDENTIFIER: 'TEXT' }
  },
  TEST_DRT: { TYPE: 'DRT', ATTRIBUTES: [], ATTRIBUTE_TYPES: {} },
  TEST_SECTION: { TYPE: 'DOCUMENT_SECTION', ATTRIBUTES: ['LEGIBLE'], ATTRIBUTE_TYPES: { LEGIBLE: 'BOOLEAN' } },
  TEST_ENTITY: { TYPE: 'DOCUMENTARY_EVIDENCE', ATTRIBUTES: ['label'], ATTRIBUTE_TYPES: { label: 'TEXT' } },
  TEST_VALUE: { TYPE: 'DOCUMENTARY_EVIDENCE', ATTRIBUTES: ['value'], ATTRIBUTE_TYPES: { value: 'TEXT' } },
  TEST_EVIDENCE: { TYPE: 'DOCUMENTARY_EVIDENCE', ATTRIBUTES: ['marker'], ATTRIBUTE_TYPES: { marker: 'TEXT' } }
};
function rdeRecord(recordId, entityId, parentId, sourceDocument, attributes, provenance) {
  const record = {
    record_id: recordId, entity_id: entityId, parent_record_id: parentId,
    source_document: sourceDocument, attributes
  };
  if (provenance !== undefined) record.provenance = provenance;
  return record;
}
fixtureRde.records = [
  rdeRecord('R000001', 'TEST_DOCUMENT', null, 'R000001',
    { REQUEST_IDENTIFIER: 'REQUEST-A', PROTOCOL_IDENTIFIER: 'PROTOCOL-A' },
    { source_location: 'TEST_ONLY root' }),
  rdeRecord('R000002', 'TEST_SECTION', 'R000001', 'R000001', { LEGIBLE: false }),
  rdeRecord('R000003', 'TEST_ENTITY', 'R000002', 'R000001',
    { label: 'TEST_ONLY entity-1' },
    { record: { marker: 'TEST_ONLY_EVIDENCE' } }),
  rdeRecord('R000004', 'TEST_VALUE', 'R000002', 'R000001', { value: 'TEST_ONLY value-4' }),
  rdeRecord('R000005', 'TEST_VALUE', 'R000002', 'R000001', { value: 'TEST_ONLY value-5' }),
  rdeRecord('R000006', 'TEST_VALUE', 'R000002', 'R000001', { value: 'TEST_ONLY value-6' }),
  rdeRecord('R000007', 'TEST_VALUE', 'R000002', 'R000001', { value: '' }),
  rdeRecord('R000008', 'TEST_VALUE', 'R000002', 'R000001', { value: 'TEST_ONLY value-8' }),
  rdeRecord('R000009', 'TEST_VALUE', 'R000002', 'R000001', { value: 'TEST_ONLY value-9' }),
  rdeRecord('R000010', 'TEST_VALUE', 'R000002', 'R000001', { value: 'TEST_ONLY value-10' }),
  rdeRecord('R000011', 'TEST_VALUE', 'R000002', 'R000001',
    { value: 'TEST_ONLY provenance unavailable' }),
  rdeRecord('R000012', 'TEST_VALUE', 'R000002', 'R000001', { value: 'TEST_ONLY value-12' }, null),
  rdeRecord('R000013', 'TEST_VALUE', 'R000002', 'R000001', { value: 'TEST_ONLY value-13' }),
  rdeRecord('R000014', 'TEST_EVIDENCE', 'R000002', 'R000001',
    { marker: 'TEST_ONLY_EVIDENCE' }, { source_location: 'TEST_ONLY evidence' }),
  rdeRecord('R000015', 'TEST_DOCUMENT', null, 'R000015', {})
];
fixtureRde.documentary_associations = [{
  association_id: 'A000001',
  left_record_id: 'R000014',
  right_record_id: 'R000003',
  source_document: 'R000001',
  statement_text: 'La evidência e o registro estão associados (declaração literal).',
  provenance: { page: 2, text_span: 'linha 8' }
}];
const originalRdeJson = JSON.stringify(fixtureRde);
const validatedRde = api.validateRdeStructure_(fixtureRde, {
  processId: 'TEST_ONLY_PROCESS', sourceFileId: 'TEST_ONLY_FILE'
}, entityCatalog);
assert.equal(validatedRde, fixtureRde);
assert.equal(JSON.stringify(fixtureRde), originalRdeJson);

const refs = {
  document: new api.TypedReference('DOCUMENT', 'R000001'),
  noIdentifiers: new api.TypedReference('DOCUMENT', 'R000015'),
  section: new api.TypedReference('DOCUMENT_SECTION', 'R000002'),
  entity: new api.TypedReference('DOCUMENTARY_EVIDENCE', 'R000003'),
  textValue4: new api.TypedReference('DOCUMENTARY_EVIDENCE', 'R000004'),
  textValue5: new api.TypedReference('DOCUMENTARY_EVIDENCE', 'R000005'),
  textValue6: new api.TypedReference('DOCUMENTARY_EVIDENCE', 'R000006'),
  emptyString: new api.TypedReference('DOCUMENTARY_EVIDENCE', 'R000007'),
  textValue8: new api.TypedReference('DOCUMENTARY_EVIDENCE', 'R000008'),
  textValue9: new api.TypedReference('DOCUMENTARY_EVIDENCE', 'R000009'),
  textValue10: new api.TypedReference('DOCUMENTARY_EVIDENCE', 'R000010'),
  textValue11: new api.TypedReference('DOCUMENTARY_EVIDENCE', 'R000011'),
  textValue12: new api.TypedReference('DOCUMENTARY_EVIDENCE', 'R000012'),
  textValue13: new api.TypedReference('DOCUMENTARY_EVIDENCE', 'R000013'),
  evidence: new api.TypedReference('DOCUMENTARY_EVIDENCE', 'R000014'),
  missing: new api.TypedReference('DOCUMENTARY_EVIDENCE', 'R999999')
};
const view = api.projectRdeToExecutionView_(validatedRde, entityCatalog);
assert.equal(view.schemaVersion(), '0.3.0');
assert.equal(view.documentaryAssociations(refs.entity).length, 1);
assert.deepEqual(JSON.parse(JSON.stringify(view.documentaryAssociations(refs.entity)[0])), {
  associationId: 'A000001',
  left: { kind: 'DOCUMENTARY_EVIDENCE', identifier: 'R000014' },
  right: { kind: 'DOCUMENTARY_EVIDENCE', identifier: 'R000003' },
  sourceDocument: { kind: 'DOCUMENT', identifier: 'R000001' },
  statementText: 'La evidência e o registro estão associados (declaração literal).',
  provenance: { page: 2, text_span: 'linha 8' }
});
assert.equal(view.documentaryAssociations(refs.document).length, 0);
assert.equal(Object.isFrozen(view.documentaryAssociations(refs.entity)), true);
assert.equal(Object.isFrozen(view.documentaryAssociations(refs.entity)[0]), true);
assert.equal(Object.isFrozen(view.documentaryAssociations(refs.entity)[0].provenance), true);
assert.equal(view.read(refs.section).LEGIBLE, false);
assert.equal(JSON.stringify(validatedRde), originalRdeJson);
assert.throws(() => api.projectRdeToExecutionView_(
  { ...validatedRde, schema_version: '0.1.0' }, entityCatalog
), /validated RDE 0.2.0\/0.3.0\/0.4.0/);
const legacyRde = { ...validatedRde, schema_version: '0.2.0' };
delete legacyRde.documentary_associations;
const legacyView = api.projectRdeToExecutionView_(legacyRde, entityCatalog);
assert.equal(legacyView.schemaVersion(), '0.2.0');
assert.deepEqual(JSON.parse(JSON.stringify(legacyView.documentaryAssociations(refs.entity))), []);
assert.throws(() => api.projectRdeToExecutionView_({
  ...legacyRde, documentary_associations: []
}, entityCatalog), /cannot declare documentary associations/);
const declarationRde = {
  ...fixtureRde,
  schema_version: '0.4.0',
  records: [
    rdeRecord('R_DRT_SOURCE', 'TEST_DOCUMENT', null, 'R_DRT_SOURCE', {}),
    rdeRecord('R_DRT_RECORD', 'TEST_DRT', null, 'R_DRT_SOURCE', {})
  ],
  documentary_associations: [],
  drt_declaration_items: [{
    declaration_id: 'D000001',
    drt_record_id: 'R_DRT_RECORD',
    activity_service_text: 'execução de instalação',
    smsci_scope_text: 'sistema de hidrantes',
    source_document: 'R_DRT_SOURCE',
    source_text: 'Atividade: execução de instalação; sistema: sistema de hidrantes.',
    provenance: { page: 2, row: 4 }
  }, {
    declaration_id: 'D000002',
    drt_record_id: 'R_DRT_RECORD',
    activity_service_text: 'vistoria de funcionamento',
    smsci_scope_text: 'alarme de incêndio',
    source_document: 'R_DRT_SOURCE',
    source_text: 'Atividade: vistoria de funcionamento; sistema: alarme de incêndio.'
  }]
};
const declarationSnapshot = JSON.stringify(declarationRde);
const validatedDeclarationRde = api.validateRdeStructure_(declarationRde, {
  processId: 'TEST_ONLY_PROCESS', sourceFileId: 'TEST_ONLY_FILE'
}, entityCatalog);
const declarationView = api.projectRdeToExecutionView_(validatedDeclarationRde, entityCatalog);
const drtRef = new api.TypedReference('DRT', 'R_DRT_RECORD');
assert.equal(declarationView.schemaVersion(), '0.4.0');
assert.deepEqual(JSON.parse(JSON.stringify(declarationView.drtDeclarationItems(drtRef))), [{
  declarationId: 'D000001',
  drt: { kind: 'DRT', identifier: 'R_DRT_RECORD' },
  activityServiceText: 'execução de instalação',
  smsciScopeText: 'sistema de hidrantes',
  sourceDocument: { kind: 'DOCUMENT', identifier: 'R_DRT_SOURCE' },
  sourceText: 'Atividade: execução de instalação; sistema: sistema de hidrantes.',
  provenance: { page: 2, row: 4 }
}, {
  declarationId: 'D000002',
  drt: { kind: 'DRT', identifier: 'R_DRT_RECORD' },
  activityServiceText: 'vistoria de funcionamento',
  smsciScopeText: 'alarme de incêndio',
  sourceDocument: { kind: 'DOCUMENT', identifier: 'R_DRT_SOURCE' },
  sourceText: 'Atividade: vistoria de funcionamento; sistema: alarme de incêndio.'
}]);
assert.equal(Object.isFrozen(declarationView.drtDeclarationItems(drtRef)), true);
assert.equal(Object.isFrozen(declarationView.drtDeclarationItems(drtRef)[0].provenance), true);
assert.throws(() => declarationView.drtDeclarationItems(
  new api.TypedReference('DOCUMENT', 'R_DRT_SOURCE')
), /requires a DRT reference/);
assert.equal(JSON.stringify(declarationRde), declarationSnapshot);
const badDeclarationRde = JSON.parse(JSON.stringify(declarationRde));
badDeclarationRde.drt_declaration_items[0].drt_record_id = 'R_DRT_SOURCE';
assert.throws(() => api.projectRdeToExecutionView_(badDeclarationRde, entityCatalog),
  error => error && error.code === 'RDE_DRT_DECLARATION_DRT_TYPE_INVALID');
const missingV4Collection = { ...declarationRde };
delete missingV4Collection.drt_declaration_items;
assert.throws(() => api.projectRdeToExecutionView_(missingV4Collection, entityCatalog));
const malformedProjectionRde = JSON.parse(JSON.stringify(validatedRde));
malformedProjectionRde.documentary_associations[0].DRT_COVERS = true;
assert.throws(() => api.projectRdeToExecutionView_(malformedProjectionRde, entityCatalog),
  error => error && error.code === 'RDE_ASSOCIATION_INVALID');
const accessorProjectionRde = JSON.parse(JSON.stringify(validatedRde));
Object.defineProperty(accessorProjectionRde.documentary_associations[0], 'statement_text', {
  enumerable: true, get() { return 'must not be evaluated'; }
});
assert.throws(() => api.projectRdeToExecutionView_(accessorProjectionRde, entityCatalog),
  error => error && error.code === 'RDE_ASSOCIATION_INVALID');
let executionToStringTagGetterCalls = 0;
const toStringTagProjectionRde = JSON.parse(JSON.stringify(validatedRde));
Object.defineProperty(toStringTagProjectionRde.documentary_associations[0],
  Symbol.toStringTag, {
    configurable: true,
    get() { executionToStringTagGetterCalls += 1; return 'Object'; }
  });
assert.throws(() => api.projectRdeToExecutionView_(toStringTagProjectionRde, entityCatalog));
assert.equal(executionToStringTagGetterCalls, 0);
const nativeDateProjectionRde = JSON.parse(JSON.stringify(validatedRde));
const nativeDateWithNullPrototype = new Date('2026-10-08T00:00:00.000Z');
Object.setPrototypeOf(nativeDateWithNullPrototype, null);
nativeDateProjectionRde.documentary_associations[0].provenance = nativeDateWithNullPrototype;
assert.throws(() => api.projectRdeToExecutionView_(nativeDateProjectionRde, entityCatalog));
for (const createNativeValue of [
  () => new Map([['declared', 'factual value']]),
  () => new Set(['factual value']),
  () => new WeakMap([[{}, 'factual value']]),
  () => new WeakSet([{}]),
  () => new ArrayBuffer(4),
  () => new DataView(new ArrayBuffer(4)),
  () => new Uint8Array([1, 2, 3])
]) {
  for (const prototype of [null, Object.prototype]) {
    const nativeValue = createNativeValue();
    Object.setPrototypeOf(nativeValue, prototype);
    const nativeValueProjectionRde = JSON.parse(JSON.stringify(validatedRde));
    nativeValueProjectionRde.documentary_associations[0].provenance = nativeValue;
    assert.throws(() => api.projectRdeToExecutionView_(nativeValueProjectionRde, entityCatalog));
  }
}
const prototypeMapRde = JSON.parse(JSON.stringify(validatedRde));
prototypeMapRde.documentary_associations = [];
let inheritedMapCalls = 0;
const associationArrayPrototype = Object.create(Array.prototype);
associationArrayPrototype.map = function forgedMap() {
  inheritedMapCalls += 1;
  return [{
    associationId: 'FORGED', left: refs.document, right: refs.entity,
    sourceDocument: refs.document, statementText: 'Statement absent from validated RDE'
  }];
};
Object.setPrototypeOf(prototypeMapRde.documentary_associations, associationArrayPrototype);
api.validateRdeStructure_(prototypeMapRde, {
  processId: 'TEST_ONLY_PROCESS', sourceFileId: 'TEST_ONLY_FILE'
}, entityCatalog);
const prototypeMapView = api.projectRdeToExecutionView_(prototypeMapRde, entityCatalog);
assert.equal(inheritedMapCalls, 0);
assert.deepEqual(JSON.parse(JSON.stringify(
  prototypeMapView.documentaryAssociations(refs.document)
)), []);
const prototypeRecordsRde = JSON.parse(JSON.stringify(validatedRde));
let inheritedRecordMethods = 0;
const recordArrayPrototype = Object.create(Array.prototype);
recordArrayPrototype.forEach = function forgedForEach() {
  inheritedRecordMethods += 1;
};
recordArrayPrototype.map = function forgedMap() {
  inheritedRecordMethods += 1;
  return [];
};
Object.setPrototypeOf(prototypeRecordsRde.records, recordArrayPrototype);
api.validateRdeStructure_(prototypeRecordsRde, {
  processId: 'TEST_ONLY_PROCESS', sourceFileId: 'TEST_ONLY_FILE'
}, entityCatalog);
const prototypeRecordsView = api.projectRdeToExecutionView_(prototypeRecordsRde, entityCatalog);
assert.equal(inheritedRecordMethods, 0);
assert.equal(prototypeRecordsView.referencesByEntity('TEST_DOCUMENT').length, 2);
let rootAssociationReads = 0;
const rootAssociationAccessor = JSON.parse(JSON.stringify(validatedRde));
Object.defineProperty(rootAssociationAccessor, 'documentary_associations', {
  enumerable: true,
  get() {
    rootAssociationReads += 1;
    return rootAssociationReads <= 2 ? [] : [{
      association_id: 'A-UNVALIDATED', left_record_id: 'R000014',
      right_record_id: 'R000003', source_document: 'R000001',
      statement_text: 'unvalidated relation', DRT_COVERS: true
    }];
  }
});
assert.throws(() => api.projectRdeToExecutionView_(rootAssociationAccessor, entityCatalog),
  /validated RDE/);
assert.equal(rootAssociationReads, 0);
assert.equal(Object.isFrozen(view), true);
assert.equal(Object.keys(view).length, 0);
for (const forbidden of [
  'getRawRde', 'getRde', 'raw', 'document', 'path', 'queryPath', 'eval', 'searchText'
]) assert.equal(view[forbidden], undefined);

assert.equal(view.contains(refs.entity), true);
assert.equal(view.contains(new api.TypedReference('DOCUMENTARY_EVIDENCE', 'R000003')), true);
assert.equal(view.contains(refs.missing), false);
assert.equal(view.read(refs.textValue4).value, 'TEST_ONLY value-4');
assert.equal(view.read(refs.textValue5).value, 'TEST_ONLY value-5');
assert.equal(view.read(refs.textValue6).value, 'TEST_ONLY value-6');
assert.equal(view.read(refs.emptyString).value, '');
assert.equal(view.read(refs.textValue8).value, 'TEST_ONLY value-8');
assert.equal(view.read(refs.textValue9).value, 'TEST_ONLY value-9');
assert.equal(view.contains(refs.textValue8), true);
assert.equal(view.contains(refs.textValue9), true);
assert.equal(view.read(refs.textValue10).value, 'TEST_ONLY value-10');
assert.equal(view.contains(refs.textValue4), true);
assert.equal(view.contains(refs.textValue5), true);
assert.equal(view.contains(refs.textValue6), true);
assert.equal(view.contains(refs.emptyString), true);
assert.equal(view.contains(refs.missing), false);
for (const presentRef of [refs.textValue4, refs.textValue5, refs.textValue6, refs.emptyString]) {
  assert.notEqual(view.contains(refs.missing), view.contains(presentRef));
}
assert.throws(() => view.read(refs.missing), /reference not found/);
assert.throws(() => view.provenance(refs.missing), /reference not found/);

const originalReturned = view.read(refs.entity);
assert.notEqual(originalReturned, view.read(refs.entity));
assert.equal(Object.isFrozen(originalReturned), true);
assert.equal(Reflect.set(originalReturned, 'label', 'MUTATED'), false);

const provenance = view.provenance(refs.entity);
assert.deepEqual(JSON.parse(JSON.stringify(provenance)), {
  record: { marker: 'TEST_ONLY_EVIDENCE' }
});
assert.equal(Object.isFrozen(provenance), true);
assert.equal(Object.isFrozen(provenance.record), true);
assert.equal(view.provenance(refs.textValue11), undefined);
assert.equal(view.provenance(refs.textValue12), null);
assert.equal(view.contains(refs.textValue11), true);
assert.equal(view.contains(refs.textValue12), true);
assert.equal(view.read(refs.textValue13).value, 'TEST_ONLY value-13');
assert.equal(view.contains(refs.textValue13), true);
assert.notEqual(
  JSON.stringify([refs.textValue4.kind, refs.textValue4.identifier]),
  JSON.stringify([refs.textValue13.kind, refs.textValue13.identifier])
);
assert.equal(view.provenance(refs.textValue4), undefined);
assert.equal(view.entityId(refs.entity), 'TEST_ENTITY');
assert.deepEqual(JSON.parse(JSON.stringify(view.parent(refs.entity))),
  { kind: 'DOCUMENT_SECTION', identifier: 'R000002' });
assert.deepEqual(JSON.parse(JSON.stringify(view.sourceDocument(refs.entity))),
  { kind: 'DOCUMENT', identifier: 'R000001' });
assert.equal(view.parent(refs.document), null);
assert.deepEqual(JSON.parse(JSON.stringify(view.sourceDocument(refs.document))),
  { kind: 'DOCUMENT', identifier: 'R000001' });
assert.equal(view.contains(refs.noIdentifiers), true);
assert.deepEqual(JSON.parse(JSON.stringify(view.read(refs.noIdentifiers))), {});
assert.equal(view.sourceDocument(refs.noIdentifiers).identifier, 'R000015');
assert.deepEqual(JSON.parse(JSON.stringify(view.referencesByEntity('TEST_DOCUMENT').map(
  ref => ref.identifier
))), ['R000001', 'R000015']);
assert.deepEqual(Object.keys(view.read(refs.entity)).sort(), ['label']);
assert.deepEqual(JSON.parse(JSON.stringify(view.referencesByEntity('TEST_VALUE').map(ref => ref.identifier))), [
  'R000004', 'R000005', 'R000006', 'R000007', 'R000008', 'R000009',
  'R000010', 'R000011', 'R000012', 'R000013'
]);
assert.deepEqual(JSON.parse(JSON.stringify(view.children(refs.document).map(ref => ref.identifier))), ['R000002']);
assert.deepEqual(JSON.parse(JSON.stringify(view.children(refs.section, 'TEST_VALUE').map(ref => ref.identifier))), [
  'R000004', 'R000005', 'R000006', 'R000007', 'R000008', 'R000009',
  'R000010', 'R000011', 'R000012', 'R000013'
]);
assert.equal(Object.isFrozen(view.referencesByEntity('TEST_VALUE')), true);

const equivalentView = api.projectRdeToExecutionView_(validatedRde, entityCatalog);
const logicalSnapshot = candidate => Object.keys(refs).sort().map(name => {
  const reference = refs[name];
  if (!candidate.contains(reference)) return [name, false];
  return [name, true, candidate.entityId(reference), candidate.read(reference), candidate.provenance(reference)];
});
assert.deepEqual(JSON.parse(JSON.stringify(logicalSnapshot(view))),
  JSON.parse(JSON.stringify(logicalSnapshot(equivalentView))));

// Mutating the original RDE after construction cannot alter the view.
validatedRde.records[0].attributes.REQUEST_IDENTIFIER = 'REQUEST-B';
validatedRde.records[0].attributes.PROTOCOL_IDENTIFIER = 'PROTOCOL-B';
validatedRde.records[2].attributes.label = 'MUTATED';
validatedRde.records[13].provenance.source_location = 'MUTATED';
validatedRde.records[13].attributes.marker = 'MUTATED_EVIDENCE';
assert.equal(view.read(refs.entity).label, 'TEST_ONLY entity-1');
assert.equal(view.read(refs.textValue5).value, 'TEST_ONLY value-5');
assert.equal(view.provenance(refs.evidence).source_location, 'TEST_ONLY evidence');
assert.equal(view.provenance(refs.entity).record.marker, 'TEST_ONLY_EVIDENCE');
validatedRde.documentary_associations[0].statement_text = 'MUTATED';
validatedRde.documentary_associations[0].provenance.page = 99;
assert.equal(view.documentaryAssociations(refs.entity)[0].statementText,
  'La evidência e o registro estão associados (declaração literal).');
assert.equal(view.documentaryAssociations(refs.entity)[0].provenance.page, 2);
assert.equal(view.referencesByEntity('TEST_DOCUMENT')[0].identifier, 'R000001');
assert.equal(view.contains(refs.noIdentifiers), true);
assert.equal(refs.noIdentifiers.identifier, 'R000015');

const directDocumentEntry = {
  reference: refs.document, entityId: 'TEST_DOCUMENT', parent: null,
  sourceDocument: refs.document, value: { REQUEST_IDENTIFIER: 'DIRECT' }
};
const directItemEntry = (reference, value, provenance, parent = null) => {
  const item = {
    reference, entityId: 'TEST_VALUE', parent,
    sourceDocument: refs.document, value
  };
  if (provenance !== undefined) item.provenance = provenance;
  return item;
};
const nestedInput = { value: { nested: { enabled: true }, items: ['TEST_ONLY'] } };
const nestedReference = new api.TypedReference('DOCUMENTARY_EVIDENCE', 'DIRECT_NESTED');
const nestedView = new api.ImmutableExecutionView([
  directDocumentEntry,
  directItemEntry(nestedReference, nestedInput)
]);
nestedInput.value.nested.enabled = false;
const nestedValue = nestedView.read(nestedReference);
assert.equal(nestedValue.value.nested.enabled, true);
assert.equal(Object.isFrozen(nestedValue.value.nested), true);
assert.equal(Object.isFrozen(nestedValue.value.items), true);
assert.equal(Reflect.set(nestedValue.value.nested, 'enabled', false), false);
assert.equal(Reflect.set(nestedValue.value.items, '0', 'MUTATED'), false);
const cyclicAssociationView = new api.ImmutableExecutionView([
  directDocumentEntry,
  directItemEntry(nestedReference, { value: 'TEST_ONLY' })
], [
  { associationId: 'A-CYCLE-1', left: refs.document, right: nestedReference,
    sourceDocument: refs.document, statementText: 'TEST_ONLY explicit relation 1' },
  { associationId: 'A-CYCLE-2', left: nestedReference, right: refs.document,
    sourceDocument: refs.document, statementText: 'TEST_ONLY explicit relation 2' }
], '0.3.0');
assert.equal(cyclicAssociationView.documentaryAssociations(refs.document).length, 2);
assert.equal(cyclicAssociationView.documentaryAssociations(nestedReference).length, 2);
let inheritedForEachCalls = 0;
const associationArrayWithForEach = [];
const associationForEachPrototype = Object.create(Array.prototype);
associationForEachPrototype.forEach = function forgedForEach() {
  inheritedForEachCalls += 1;
};
Object.setPrototypeOf(associationArrayWithForEach, associationForEachPrototype);
const safeEmptyAssociationView = new api.ImmutableExecutionView([
  directDocumentEntry,
  directItemEntry(nestedReference, { value: 'TEST_ONLY' })
], associationArrayWithForEach, '0.3.0');
assert.equal(inheritedForEachCalls, 0);
assert.deepEqual(JSON.parse(JSON.stringify(
  safeEmptyAssociationView.documentaryAssociations(refs.document)
)), []);
assert.throws(() => new api.ImmutableExecutionView([
  directDocumentEntry,
  directItemEntry(nestedReference, { value: 'TEST_ONLY' })
], [{
  associationId: 'A-DANGLING', left: refs.document,
  right: new api.TypedReference('DOCUMENTARY_EVIDENCE', 'MISSING'),
  sourceDocument: refs.document, statementText: 'TEST_ONLY'
}], '0.3.0'), /association reference is missing/);
assert.throws(() => new api.ImmutableExecutionView([
  directDocumentEntry,
  { ...directDocumentEntry, value: { REQUEST_IDENTIFIER: 'DUPLICATE' } }
]), /duplicate reference/);
assert.throws(() => new api.ImmutableExecutionView([
  { ...directDocumentEntry, reference: { kind: 'DOCUMENT', identifier: 'fake' } }
]), /TypedReference/);
assert.throws(() => view.contains({ kind: 'DOCUMENTARY_EVIDENCE', identifier: 'R000003' }), /TypedReference/);
assert.throws(() => new api.TypedReference('', 'malformed'), /reference kind/);
const cyclic = [];
cyclic.push(cyclic);
assert.throws(() => new api.ImmutableExecutionView([
  directDocumentEntry,
  directItemEntry(new api.TypedReference('DOCUMENTARY_EVIDENCE', 'cycle'), { value: cyclic })
]), /cyclic projection values/);
const cyclicObject = { nested: {} };
cyclicObject.nested.parent = cyclicObject;
assert.throws(() => new api.ImmutableExecutionView([
  directDocumentEntry,
  directItemEntry(new api.TypedReference('DOCUMENTARY_EVIDENCE', 'object-cycle'), cyclicObject)
]), /cyclic projection values/);
assert.throws(() => new api.ImmutableExecutionView([
  directDocumentEntry,
  directItemEntry(new api.TypedReference('DOCUMENTARY_EVIDENCE', 'provenance-cycle'),
    { value: 'TEST_ONLY' }, cyclicObject)
]), /cyclic projection values/);
assert.throws(() => new api.ImmutableExecutionView([
  directDocumentEntry,
  directItemEntry(new api.TypedReference('DOCUMENTARY_EVIDENCE', 'dangling-parent'),
    { value: 1 }, undefined, new api.TypedReference('DOCUMENT_SECTION', 'missing'))
]), /missing from the view/);
const cycleA = new api.TypedReference('CONCEPT', 'R000020');
const cycleB = new api.TypedReference('CONCEPT', 'R000021');
assert.throws(() => new api.ImmutableExecutionView([
  directDocumentEntry,
  { reference: cycleA, entityId: 'TEST_NODE', parent: cycleB,
    sourceDocument: refs.document, value: {} },
  { reference: cycleB, entityId: 'TEST_NODE', parent: cycleA,
    sourceDocument: refs.document, value: {} }
]), /cyclic parent relation/);

let resolverView;
const resolver = {
  resolve(_arguments, processMemory) {
    resolverView = processMemory;
    const present = processMemory.contains(refs.textValue5);
    const value = processMemory.read(refs.textValue5).value;
    const origin = processMemory.sourceDocument(refs.textValue5);
    const evidencePresent = processMemory.contains(refs.evidence);
    return {
      result: present && value === 'TEST_ONLY value-5' && evidencePresent && origin.kind === 'DOCUMENT'
        ? api.EngineResult.TRUE : api.EngineResult.FALSE,
      memoryReferences: [refs.textValue5, refs.evidence]
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
  expression: new api.PredicateCall('TEST_ONLY_VIEW_LOOKUP', { target: refs.textValue5 }),
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
  { kind: 'DOCUMENTARY_EVIDENCE', identifier: 'R000005' },
  { kind: 'DOCUMENTARY_EVIDENCE', identifier: 'R000014' }
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
