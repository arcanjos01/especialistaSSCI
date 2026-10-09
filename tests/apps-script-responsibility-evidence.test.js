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
