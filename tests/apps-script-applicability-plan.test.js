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
  '../apps-script/ExecutionPlanCore.js'
]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, relativePath), 'utf8'), context);
}
vm.runInContext(`globalThis.api = {
  COMPILED_RUNTIME_CONTRACT,
  isCanonicalCompiledRuntimeContract,
  TypedReference,
  ImmutableExecutionView,
  projectRdeToExecutionView_,
  createCurrentSubmissionContext,
  resolveCbmscApplicability,
  isCanonicalCbmscApplicabilityResolution,
  materializeFrozenExecutionPlan,
  isCanonicalFrozenExecutionPlan,
  validateExecutionPlanIntegrity,
  ApplicabilityBlocker,
  ExecutionIntegrityError
};`, context);
const api = context.api;
const contract = api.COMPILED_RUNTIME_CONTRACT;

for (const name of [
  'resolveCbmscApplicability',
  'isCanonicalCbmscApplicabilityResolution',
  'materializeFrozenExecutionPlan',
  'isCanonicalFrozenExecutionPlan',
  'validateExecutionPlanIntegrity'
]) {
  const descriptor = vm.runInContext(
    "Object.getOwnPropertyDescriptor(globalThis, " + JSON.stringify(name) + ")", context
  );
  assert.equal(descriptor.writable, false, name);
  assert.equal(descriptor.configurable, false, name);
}

const currentContext = (requestDate = '2026-01-28', overrides = {}) =>
  api.createCurrentSubmissionContext({
    protocolIdentifier: 'TEST_ONLY_PROTOCOL',
    requestDate,
    reIdentifier: 'TEST_ONLY_RE',
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_INTAKE' },
    ...overrides
  });

function makeRde({ codes = [], requestDate = '2026-01-28', flags = {},
  sectionCount = 1, extraDocuments = [] } = {}) {
  const records = [{
    record_id: 'DOC_CURRENT', entity_id: 'COMPROVANTE_DE_SOLICITACAO_DE_HABITESE',
    parent_record_id: null, source_document: 'DOC_CURRENT',
    attributes: { PROTOCOL_IDENTIFIER: 'TEST_ONLY_PROTOCOL', REQUEST_DATE: requestDate,
      RE_IDENTIFIER: 'TEST_ONLY_RE' },
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_DOCUMENT' }
  }];
  for (let index = 0; index < sectionCount; index += 1) {
    const attributes = {};
    for (const field of ['STRUCTURALLY_COMPLETE', 'LEGIBLE', 'VERIFIABLE']) {
      const value = Object.prototype.hasOwnProperty.call(flags, field) ? flags[field] : true;
      if (value !== 'MISSING') attributes[field] = value;
    }
    records.push({
      record_id: index === 0 ? 'SECTION_CURRENT' : 'SECTION_CURRENT_' + index,
      entity_id: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA',
      parent_record_id: 'DOC_CURRENT', source_document: 'DOC_CURRENT', attributes,
      provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_SECTION_' + index }
    });
  }
  codes.forEach((code, index) => records.push({
    record_id: 'ITEM_' + index, entity_id: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA_ITEM',
    parent_record_id: 'SECTION_CURRENT', source_document: 'DOC_CURRENT',
    attributes: code === null ? { PRESENTED_SYSTEM_MEASURE_DESCRIPTION: 'TEST_ONLY description' } : {
      OFFICIAL_ESCI_CODE: code,
      PRESENTED_SYSTEM_MEASURE_DESCRIPTION: 'TEST_ONLY description',
      RPCI_ORIENTATIVE_TEXT: 'TEST_ONLY orientative text',
      SOURCE_LOCATION: 'TEST_ONLY page ' + index
    },
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_ITEM_' + index }
  }));
  extraDocuments.forEach((document, index) => records.push({
    record_id: 'DOC_OTHER_' + index,
    entity_id: 'COMPROVANTE_DE_SOLICITACAO_DE_HABITESE',
    parent_record_id: null, source_document: 'DOC_OTHER_' + index,
    attributes: document,
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_OTHER' }
  }));
  return { schema_version: '0.2.0', records };
}

function resolve(options = {}, submission = currentContext()) {
  const rde = makeRde(options);
  const view = api.projectRdeToExecutionView_(rde, contract.entityCatalog);
  return { rde, view, resolution: api.resolveCbmscApplicability(view, submission, contract) };
}

function assertBlocker(action) {
  assert.throws(action, error => error && [
    'ARCHITECTURAL_BLOCKER', 'RDE_ATTRIBUTE_VALUE_TYPE_INVALID'
  ].includes(error.code));
}

function assertIntegrityError(action) {
  assert.throws(action, error => error && error.code === 'EXECUTION_INTEGRITY_ERROR');
}

function makeDirectView(sectionAttributes) {
  const document = new api.TypedReference('DOCUMENT', 'TEST_ONLY_DIRECT_DOCUMENT');
  const section = new api.TypedReference('DOCUMENT_SECTION', 'TEST_ONLY_DIRECT_SECTION');
  return new api.ImmutableExecutionView([
    {
      reference: document,
      entityId: 'COMPROVANTE_DE_SOLICITACAO_DE_HABITESE',
      parent: null,
      sourceDocument: document,
      value: { PROTOCOL_IDENTIFIER: 'TEST_ONLY_PROTOCOL', REQUEST_DATE: '2026-01-28' },
      provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_DOCUMENT' }
    },
    {
      reference: section,
      entityId: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA',
      parent: document,
      sourceDocument: document,
      value: sectionAttributes,
      provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_SECTION' }
    }
  ]);
}

assert.equal(contract.officialEsciTargets.length, 28);
assert.equal(Object.isFrozen(contract.entityCatalog), true);
assert.equal(Object.isFrozen(contract.officialEsciTargets), true);

// Every one of the 28 canonical codes activates exactly its own official target.
for (const official of contract.officialEsciTargets) {
  const { resolution } = resolve({ codes: [official.code] });
  const decision = resolution.officialDecisions.find(item => item.target === official.entityId);
  assert.equal(decision.decision, 'POSITIVE', official.code);
  assert.equal(decision.itemReferences.length, 1, official.code);
  assert.equal(resolution.officialDecisions.filter(item => item.decision === 'POSITIVE').length, 1);
  assert.equal(resolution.PROCESS_SMSCI.includes(official.entityId), true);
}

// Complete empty section explicitly supports 28 negative decisions; it does not imply other rules.
const emptyCase = resolve();
const empty = emptyCase.resolution;
assert.equal(empty.officialDecisions.length, 28);
assert.equal(empty.officialDecisions.every(item => item.decision === 'NEGATIVE'), true);
assert.equal(empty.PROCESS_SMSCI.includes('SMSCI_SDAI'), false);
assert.equal(empty.derivedDecisions.find(item => item.target === 'SMSCI_SDAI').decision, 'NEGATIVE');
assert.equal(empty.derivedDecisions.find(item => item.target === 'SMSCI_IN19_APPLICABILITY_REVIEW').decision, 'POSITIVE');
assert.equal(empty.IN19_DOCUMENTATION_REGIME, undefined);

// AI/DAI remain independent official facts; either positive derives SDAI.
for (const codes of [['AI'], ['DAI'], ['AI', 'DAI']]) {
  const { resolution } = resolve({ codes });
  assert.equal(resolution.officialDecisions.find(item => item.target === 'SMSCI_AI').decision,
    codes.includes('AI') ? 'POSITIVE' : 'NEGATIVE');
  assert.equal(resolution.officialDecisions.find(item => item.target === 'SMSCI_DAI').decision,
    codes.includes('DAI') ? 'POSITIVE' : 'NEGATIVE');
  assert.equal(resolution.derivedDecisions.find(item => item.target === 'SMSCI_SDAI').decision, 'POSITIVE');
  assert.equal(resolution.PROCESS_SMSCI.filter(target => target === 'SMSCI_SDAI').length, 1);
}
assert.equal(resolve({ codes: ['AI', 'DAI'] }).resolution.officialDecisions
  .filter(item => ['SMSCI_AI', 'SMSCI_DAI'].includes(item.target)).length, 2);

// Unknown/missing item code and untraceable relation data block before any partial release.
assertBlocker(() => resolve({ codes: ['TEST_ONLY_UNKNOWN_CODE'] }));
assertBlocker(() => resolve({ codes: [null] }));
assertBlocker(() => resolve({ sectionCount: 0 }));
assertBlocker(() => resolve({ sectionCount: 2 }));
assertBlocker(() => resolve({ flags: { STRUCTURALLY_COMPLETE: false } }));
assertBlocker(() => resolve({ flags: { STRUCTURALLY_COMPLETE: null } }));
assertBlocker(() => resolve({ flags: { STRUCTURALLY_COMPLETE: 'MISSING' } }));
assertBlocker(() => resolve({ flags: { LEGIBLE: false } }));
assertBlocker(() => resolve({ flags: { LEGIBLE: 'MISSING' } }));
assertBlocker(() => resolve({ flags: { VERIFIABLE: false } }));
assertBlocker(() => resolve({ flags: { VERIFIABLE: 'MISSING' } }));
for (const invalidFlags of [
  { STRUCTURALLY_COMPLETE: null, LEGIBLE: true, VERIFIABLE: true },
  { STRUCTURALLY_COMPLETE: true, LEGIBLE: null, VERIFIABLE: true },
  { STRUCTURALLY_COMPLETE: true, LEGIBLE: true }
]) {
  assertBlocker(() => api.resolveCbmscApplicability(
    makeDirectView(invalidFlags), currentContext(), contract
  ));
}

// Exact protocol + date selects only the current re-presentation; no latest-wins.
const secondRde = makeRde({ extraDocuments: [
  { PROTOCOL_IDENTIFIER: 'TEST_ONLY_PROTOCOL', REQUEST_DATE: '2025-12-31', RE_IDENTIFIER: 'TEST_ONLY_RE' },
  { PROTOCOL_IDENTIFIER: 'TEST_ONLY_OTHER', REQUEST_DATE: '2026-01-28', RE_IDENTIFIER: 'TEST_ONLY_RE' }
] });
const secondView = api.projectRdeToExecutionView_(secondRde, contract.entityCatalog);
const selected = api.resolveCbmscApplicability(secondView, currentContext(), contract);
assert.equal(selected.selectedComprovante.identifier, 'DOC_CURRENT');
assertBlocker(() => api.resolveCbmscApplicability(
  api.projectRdeToExecutionView_(makeRde({ extraDocuments: [
    { PROTOCOL_IDENTIFIER: 'TEST_ONLY_PROTOCOL', REQUEST_DATE: '2026-01-28', RE_IDENTIFIER: 'TEST_ONLY_RE' }
  ] }), contract.entityCatalog), currentContext(), contract
));
assertBlocker(() => resolve({}, currentContext('invalid')));
assertBlocker(() => resolve({ requestDate: '2026-01-27' }));
assertBlocker(() => resolve({ requestDate: '2026-02-30' }));
assertBlocker(() => resolve({}, currentContext('2026-01-28', {
  reIdentifier: 'TEST_ONLY_OTHER_RE'
})));

// A duplicate item code does not create a duplicate target and all positive references are retained.
const duplicateCode = resolve({ codes: ['IEL', 'IEL'] }).resolution;
const ielDecision = duplicateCode.officialDecisions.find(item => item.target === 'SMSCI_IEL');
assert.equal(ielDecision.itemReferences.length, 2);
assert.equal(duplicateCode.PROCESS_SMSCI.filter(target => target === 'SMSCI_IEL').length, 1);

// IN19 regime uses only the selected comprovante civil REQUEST_DATE.
for (const [date, expected] of [
  ['2024-04-23', 'LEGACY'], ['2024-04-24', 'LEGACY'], ['2024-04-25', 'CURRENT']
]) {
  const { resolution } = resolve({ codes: ['IEL'], requestDate: date }, currentContext(date));
  assert.equal(resolution.IN19_DOCUMENTATION_REGIME, expected);
  assert.equal(resolution.IN19_DOCUMENTATION_REGIME_TRACE.source, 'REQUEST_DATE');
  assert.equal(resolution.IN19_DOCUMENTATION_REGIME_TRACE.decision, expected);
  assert.equal(resolution.IN19_DOCUMENTATION_REGIME_TRACE.selectedDocument.reference.identifier,
    resolution.selectedComprovante.identifier);
}
assert.equal(resolve().resolution.IN19_DOCUMENTATION_REGIME, undefined);
const legacyCase = resolve({ codes: ['IEL'], requestDate: '2024-04-24' },
  currentContext('2024-04-24'));
const legacyResolution = legacyCase.resolution;
const legacyPlan = api.materializeFrozenExecutionPlan(contract, legacyResolution, legacyCase.view);
assert.equal(legacyPlan.APPLICABLE_REQUIREMENTS.some(item =>
  item.requirementId === 'REQ_IN19_LEGACY_DOCUMENTATION'), true);
assert.equal(legacyPlan.APPLICABLE_REQUIREMENTS.some(item =>
  ['REQ_IN19_EXECUTION', 'REQ_IN19_GROUNDING', 'REQ_IN19_FINAL_VERIFICATION',
    'REQ_IN19_REGIME_REVIEW'].includes(item.requirementId)), false);
assert.equal(legacyPlan.PLANNED_EXECUTION_UNITS.some(unit =>
  unit.criterion.id === 'T4_IN19_REGIME_REVIEW'), false);

// Applicability, trace, decisions and plans are immutable and deterministic.
const complete = resolve({ codes: ['AI', 'IEL', 'IGC', 'PPE'] });
const resolution = complete.resolution;
assert.equal(Object.isFrozen(resolution), true);
assert.equal(Object.isFrozen(resolution.officialDecisions[0]), true);
assert.equal(Object.isFrozen(resolution.officialDecisions[0].selectedDocument), true);
assert.equal(resolution.officialDecisions.find(item => item.target === 'SMSCI_IGC'), undefined);
assert.equal(resolution.officialDecisions.find(item => item.target === 'SMSCI_GAS').decision, 'POSITIVE');
const firstPlan = api.materializeFrozenExecutionPlan(contract, resolution, complete.view);
const secondPlan = api.materializeFrozenExecutionPlan(contract, resolution, complete.view);
assert.deepEqual(JSON.parse(JSON.stringify(firstPlan)), JSON.parse(JSON.stringify(secondPlan)));
assert.equal(Object.isFrozen(firstPlan), true);
assert.equal(Object.isFrozen(firstPlan.PLANNED_EXECUTION_UNITS), true);
assert.equal(Object.isFrozen(firstPlan.ITERATION_DOMAINS), true);
assert.equal(firstPlan.PLANNED_EXECUTION_UNITS.some(unit =>
  'result' in unit || 'evidence' in unit || 'nonconformity' in unit || 'EngineResult' in unit
), false);
for (const unit of firstPlan.PLANNED_EXECUTION_UNITS) {
  const requirement = contract.requirements.find(item => item.requirementId === unit.requirement.id);
  const criterion = contract.criteria.find(item => item.criterionId === unit.criterion.id);
  assert.equal(unit.unitKey, `UNIT_KEY (${requirement.requirementId}, ${criterion.criterionId})`);
  assert.equal(unit.requirementTable, requirement.table);
  assert.equal(unit.criterionTable, criterion.table);
  assert.equal(unit.context, criterion.context === undefined ? null : criterion.context);
  assert.equal(JSON.stringify(unit.validate), JSON.stringify(requirement.validate));
  assert.equal(JSON.stringify(unit.criterionValidate), JSON.stringify(criterion.validate));
  assert.equal(unit.appliesTo, criterion.appliesTo === undefined ? null : criterion.appliesTo);
  assert.equal(JSON.stringify(unit.nonconformityReferences.requirement),
    JSON.stringify(requirement.nonconformities));
  assert.equal(JSON.stringify(unit.nonconformityReferences.criterionFail),
    JSON.stringify(criterion.failNonconformities));
}
assert.equal(firstPlan.APPLICABLE_REQUIREMENTS.some(item => item.requirementId === 'REQ_IN19_REGIME_REVIEW'), false);
assert.equal(JSON.stringify(firstPlan.APPLICABLE_REQUIREMENTS.filter(item =>
  item.smsci === 'SMSCI_IEL').map(item => item.requirementId)), JSON.stringify([
  'REQ_IN19_EXECUTION', 'REQ_IN19_GROUNDING', 'REQ_IN19_FINAL_VERIFICATION'
]));
assert.equal(firstPlan.PLANNED_EXECUTION_UNITS.some(unit => unit.criterion.id === 'T4_IN19_REGIME_REVIEW'), false);
assert.equal(firstPlan.APPLICABLE_REQUIREMENTS.some(item => item.requirementId === 'REQ_IN19_APPLICABILITY_REVIEW'), false);

// A negative IEL keeps only the declared internal IN19 applicability-review route.
const noIelPlan = api.materializeFrozenExecutionPlan(contract, empty, emptyCase.view);
assert.equal(noIelPlan.APPLICABLE_REQUIREMENTS.some(item =>
  item.requirementId === 'REQ_IN19_APPLICABILITY_REVIEW'), true);
assert.equal(noIelPlan.PLANNED_EXECUTION_UNITS.some(unit =>
  unit.criterion.id === 'T4_IN19_APPLICABILITY_REVIEW'), true);
assert.equal(noIelPlan.APPLICABLE_REQUIREMENTS.some(item =>
  item.requirementId === 'REQ_IN19_REGIME_REVIEW'), false);

// Requirement order follows the canonical metadata; general Requirements remain selected.
assert.equal(JSON.stringify(firstPlan.APPLICABLE_REQUIREMENTS.map(item => item.requirementId)),
  JSON.stringify(contract.requirements.filter(item => {
    if (item.smsci && !firstPlan.PROCESS_SMSCI.includes(item.smsci)) return false;
    if (item.in19DocumentationRegime && item.in19DocumentationRegime !== firstPlan.IN19_DOCUMENTATION_REGIME) return false;
    return true;
  }).map(item => item.requirementId)));
assert.equal(firstPlan.APPLICABLE_REQUIREMENTS.some(item => item.requirementId === 'REQ_T1_DRT_REQUIRED'), true);
assert.equal(firstPlan.APPLICABLE_REQUIREMENTS.some(item => item.requirementId === 'REQ_IN08_ESTANQUEIDADE'), true);
assert.equal(firstPlan.APPLICABLE_REQUIREMENTS.some(item => item.requirementId === 'REQ_IN08_MANUAL'), true);
assert.equal(firstPlan.APPLICABLE_REQUIREMENTS.some(item => item.requirementId === 'REQ_IN19_REGIME_REVIEW'), false);
assert.equal(noIelPlan.APPLICABLE_REQUIREMENTS.some(item =>
  ['REQ_IN19_EXECUTION', 'REQ_IN19_GROUNDING', 'REQ_IN19_FINAL_VERIFICATION',
    'REQ_IN19_LEGACY_DOCUMENTATION'].includes(item.requirementId)), false);
assert.equal(noIelPlan.APPLICABLE_REQUIREMENTS.some(item =>
  item.requirementId.startsWith('REQ_IN34_')), false);
assert.equal(noIelPlan.PLANNED_EXECUTION_UNITS.some(unit =>
  unit.criterion.id.startsWith('T4_IN34_')), false);

// WORKLIST includes only positive official targets and remains a binding domain, not unit fan-out.
assert.equal(JSON.stringify(firstPlan.WORKLIST_SMSCI), JSON.stringify(
  contract.officialEsciTargets.filter(item => firstPlan.PROCESS_SMSCI.includes(item.entityId))
    .map(item => item.entityId)));
assert.equal(firstPlan.WORKLIST_SMSCI.includes('SMSCI_SDAI'), false);
assert.equal(firstPlan.WORKLIST_SMSCI.includes('SMSCI_IN19_APPLICABILITY_REVIEW'), false);
assert.equal(resolution.officialDecisions.some(item =>
  ['SMSCI_M5', 'SMSCI_SMOKE_CONTROL_MECHANICAL', 'M5_EXPLOSION_PROTECTION',
    'M5_DUST_CONTROL', 'M5_HEAT_SENSORS', 'M5_LIGHTNING_PROTECTION'].includes(item.target)), false);
assert.equal(firstPlan.PROCESS_SMSCI.some(target =>
  ['SMSCI_M5', 'SMSCI_SMOKE_CONTROL_MECHANICAL', 'M5_EXPLOSION_PROTECTION',
    'M5_DUST_CONTROL', 'M5_HEAT_SENSORS', 'M5_LIGHTNING_PROTECTION'].includes(target)), false);
const iterative = firstPlan.PLANNED_EXECUTION_UNITS.filter(unit =>
  unit.unitKey === 'UNIT_KEY (REQ_T1_DRT_SMSCI, T1_DRT_SMSCI_COVERAGE)');
assert.equal(iterative.length, 1);
assert.equal(JSON.stringify(iterative[0].iterationDomain), JSON.stringify(firstPlan.WORKLIST_SMSCI));
assert.equal(firstPlan.ITERATION_DOMAINS.length, 1);
assert.equal(JSON.stringify(iterative[0].plannedBindings.map(binding => binding.target)),
  JSON.stringify(firstPlan.WORKLIST_SMSCI));

// Integrity gate rejects duplicates, missing/extra/reordered units and broken metadata references.
const applicableIds = firstPlan.APPLICABLE_REQUIREMENTS.map(item => item.requirementId);
const validUnits = firstPlan.PLANNED_EXECUTION_UNITS.map(unit => JSON.parse(JSON.stringify(unit)));
assert.equal(api.validateExecutionPlanIntegrity(contract, resolution, applicableIds,
  firstPlan.WORKLIST_SMSCI, validUnits), true);
assertIntegrityError(() => api.validateExecutionPlanIntegrity(contract, resolution,
  applicableIds, firstPlan.WORKLIST_SMSCI, [...validUnits, validUnits[0]]));
assertIntegrityError(() => api.validateExecutionPlanIntegrity(contract, resolution,
  applicableIds, firstPlan.WORKLIST_SMSCI, validUnits.slice(1)));
assertIntegrityError(() => api.validateExecutionPlanIntegrity(contract, resolution,
  applicableIds, firstPlan.WORKLIST_SMSCI, [...validUnits, { unitKey: 'UNIT_KEY (EXTRA, EXTRA)' }]));
assertIntegrityError(() => api.validateExecutionPlanIntegrity(contract, resolution,
  applicableIds.slice(1), firstPlan.WORKLIST_SMSCI, validUnits));
assertIntegrityError(() => api.validateExecutionPlanIntegrity(contract, resolution,
  [...applicableIds, 'REQ_NOT_DECLARED'], firstPlan.WORKLIST_SMSCI, validUnits));
assertIntegrityError(() => api.validateExecutionPlanIntegrity(contract, resolution,
  applicableIds, firstPlan.WORKLIST_SMSCI, validUnits.slice().reverse()));
const missingCriterionUnit = validUnits.map(unit => JSON.parse(JSON.stringify(unit)));
missingCriterionUnit[0].criterion.id = 'CRITERION_NOT_DECLARED';
assertIntegrityError(() => api.validateExecutionPlanIntegrity(contract, resolution,
  applicableIds, firstPlan.WORKLIST_SMSCI, missingCriterionUnit));

const badCriterion = JSON.parse(JSON.stringify(contract));
badCriterion.criteria[0].requirementId = 'REQ_NOT_DECLARED';
assertIntegrityError(() => api.validateExecutionPlanIntegrity(badCriterion, resolution,
  applicableIds, firstPlan.WORKLIST_SMSCI, validUnits));
const badTable = JSON.parse(JSON.stringify(contract));
badTable.criteria[0].table = '9';
assertIntegrityError(() => api.validateExecutionPlanIntegrity(badTable, resolution,
  applicableIds, firstPlan.WORKLIST_SMSCI, validUnits));
const badAppliesTo = JSON.parse(JSON.stringify(contract));
const appliesCriterion = badAppliesTo.criteria.find(item => item.appliesTo === 'SMSCI_GAS');
appliesCriterion.appliesTo = 'SMSCI_PPE';
assertIntegrityError(() => api.validateExecutionPlanIntegrity(badAppliesTo, resolution,
  applicableIds, firstPlan.WORKLIST_SMSCI, validUnits));
const badNc = JSON.parse(JSON.stringify(contract));
badNc.criteria[0].failNonconformities.push('NC_NOT_DECLARED');
assertIntegrityError(() => api.validateExecutionPlanIntegrity(badNc, resolution,
  applicableIds, firstPlan.WORKLIST_SMSCI, validUnits));
const badNcTable = JSON.parse(JSON.stringify(contract));
badNcTable.nonconformities.NC_T4_001.TABLE = '1';
assertIntegrityError(() => api.validateExecutionPlanIntegrity(badNcTable, resolution,
  applicableIds, firstPlan.WORKLIST_SMSCI, validUnits));
const badIteration = JSON.parse(JSON.stringify(contract));
badIteration.compiledExecutionIndex.find(item => item.requirementId === 'REQ_T1_DRT_SMSCI')
  .iterationSource = 'UNKNOWN.SOURCE';
assertIntegrityError(() => api.validateExecutionPlanIntegrity(badIteration, resolution,
  applicableIds, firstPlan.WORKLIST_SMSCI, validUnits));
const partialResolution = { ...resolution, officialDecisions: resolution.officialDecisions.slice(1) };
assertIntegrityError(() => api.validateExecutionPlanIntegrity(contract, partialResolution,
  applicableIds, firstPlan.WORKLIST_SMSCI, validUnits));
const badContractTarget = JSON.parse(JSON.stringify(contract));
badContractTarget.officialEsciTargets.pop();
assertBlocker(() => api.resolveCbmscApplicability(complete.view, currentContext(), badContractTarget));

// Canonical provenance gates reject copied resolutions and bind the plan to one view.
function deepFreezeForTest(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.keys(value).forEach(key => deepFreezeForTest(value[key]));
  return Object.freeze(value);
}
const copiedResolution = deepFreezeForTest(JSON.parse(JSON.stringify(empty)));
assert.equal(api.isCanonicalCbmscApplicabilityResolution(
  copiedResolution, emptyCase.view, contract
), false);
assertIntegrityError(() => api.materializeFrozenExecutionPlan(
  contract, copiedResolution, emptyCase.view
));
const equivalentCase = resolve({ codes: ['AI', 'IEL', 'IGC', 'PPE'] });
assert.equal(api.isCanonicalFrozenExecutionPlan(firstPlan, contract, complete.view), true);
assert.equal(api.isCanonicalFrozenExecutionPlan(firstPlan, contract, equivalentCase.view), false);
const contractDescriptor = vm.runInContext(
  "Object.getOwnPropertyDescriptor(globalThis, 'COMPILED_RUNTIME_CONTRACT')", context
);
assert.equal(contractDescriptor.writable, false);
assert.equal(contractDescriptor.configurable, false);
const copiedContract = deepFreezeForTest(JSON.parse(JSON.stringify(contract)));
assert.equal(api.isCanonicalCompiledRuntimeContract(copiedContract), false);
assertBlocker(() => api.resolveCbmscApplicability(
  complete.view, currentContext(), copiedContract
));
assertIntegrityError(() => api.materializeFrozenExecutionPlan(
  copiedContract, resolution, complete.view
));

// F4-006: decoy globals with the old helper names cannot influence private closures.
assert.equal(vm.runInContext("typeof cbmscDeepFreeze_", context), 'undefined');
assert.equal(vm.runInContext("typeof planFreeze_", context), 'undefined');

const gasCaseForBypass = resolve({ codes: ['IGC'] });
const noGasCaseForBypass = resolve();
const gasPlanForBypass = api.materializeFrozenExecutionPlan(
  contract, gasCaseForBypass.resolution, gasCaseForBypass.view
);
assert.equal(gasPlanForBypass.PLANNED_EXECUTION_UNITS.some(unit =>
  unit.criterion.id === 'T4_IN08_MANUAL'
), true);
assert.equal(noGasCaseForBypass.resolution.PROCESS_SMSCI.includes('SMSCI_GAS'), false);

context.__F4_RESOLUTION_A__ = gasCaseForBypass.resolution;
context.__F4_PLAN_A__ = gasPlanForBypass;
vm.runInContext(
  "globalThis.cbmscDeepFreeze_ = function () { return globalThis.__F4_RESOLUTION_A__; };",
  context
);
vm.runInContext(
  "globalThis.planFreeze_ = function () { return globalThis.__F4_PLAN_A__; };",
  context
);

const resolutionAfterDecoy = api.resolveCbmscApplicability(
  noGasCaseForBypass.view, currentContext(), contract
);
assert.notEqual(resolutionAfterDecoy, gasCaseForBypass.resolution);
assert.equal(resolutionAfterDecoy.PROCESS_SMSCI.includes('SMSCI_GAS'), false);
assert.equal(api.isCanonicalCbmscApplicabilityResolution(
  resolutionAfterDecoy, noGasCaseForBypass.view, contract
), true);

const planAfterDecoy = api.materializeFrozenExecutionPlan(
  contract, resolutionAfterDecoy, noGasCaseForBypass.view
);
assert.notEqual(planAfterDecoy, gasPlanForBypass);
assert.equal(planAfterDecoy.PLANNED_EXECUTION_UNITS.some(unit =>
  unit.criterion.id === 'T4_IN08_MANUAL'
), false);
assert.equal(api.isCanonicalFrozenExecutionPlan(
  gasPlanForBypass, contract, noGasCaseForBypass.view
), false);
assert.equal(api.isCanonicalFrozenExecutionPlan(
  planAfterDecoy, contract, noGasCaseForBypass.view
), true);

// Mutating the source RDE after view creation and resolution cannot alter the frozen trace.
complete.rde.records[2].attributes.OFFICIAL_ESCI_CODE = 'TEST_ONLY_MUTATED';
assert.equal(resolution.officialDecisions.find(item => item.target === 'SMSCI_AI').decision, 'POSITIVE');
assert.equal(Object.isFrozen(resolution.officialDecisions.find(item => item.target === 'SMSCI_AI').itemTraces[0].provenance), true);
assert.equal(JSON.stringify(firstPlan.PLANNED_EXECUTION_UNITS),
  JSON.stringify(secondPlan.PLANNED_EXECUTION_UNITS));

console.log('apps-script-applicability-plan: PASS');
