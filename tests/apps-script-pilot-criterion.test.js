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
  '../apps-script/CriterionExecutionCore.js'
]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, relativePath), 'utf8'), context);
}
vm.runInContext(
  'globalThis.api = {' +
  'COMPILED_RUNTIME_CONTRACT,' +
  'TypedReference,' +
  'EngineResult,' +
  'projectRdeToExecutionView_,' +
  'createCurrentSubmissionContext,' +
  'resolveCbmscApplicability,' +
  'materializeFrozenExecutionPlan,' +
  'materializePlannedCriterion,' +
  'executePlannedCriterion,' +
  'CriterionExecutionIntegrityError' +
  '};',
  context
);
const api = context.api;
const contract = api.COMPILED_RUNTIME_CONTRACT;

for (const name of [
  'materializePlannedCriterion',
  'executePlannedCriterion'
]) {
  const descriptor = vm.runInContext(
    "Object.getOwnPropertyDescriptor(globalThis, " + JSON.stringify(name) + ")", context
  );
  assert.equal(descriptor.writable, false, name);
  assert.equal(descriptor.configurable, false, name);
}
assert.equal(vm.runInContext("typeof criterionExecutionFindUnit_", context), 'undefined');
assert.equal(vm.runInContext("typeof criterionExecutionMaterializeAssert_", context), 'undefined');

const PILOT_UNIT = 'UNIT_KEY (REQ_IN08_MANUAL, T4_IN08_MANUAL)';
const PRESSURIZATION_MANUAL_UNIT =
  'UNIT_KEY (REQ_IN09_MANUAL, T4_IN09_MANUAL)';

function currentContext(requestDate = '2026-01-28') {
  return api.createCurrentSubmissionContext({
    protocolIdentifier: 'TEST_ONLY_PROTOCOL',
    requestDate,
    reIdentifier: 'TEST_ONLY_RE',
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_INTAKE' }
  });
}

function makeRde({ includeGas = true, includeManual = false, includeIel = false,
  includePressurization = false, includePressurizationManual = false,
  includeLegacyExecutionDrt = false, requestDate = '2026-01-28' } = {}) {
  const records = [{
    record_id: 'DOC_CURRENT', entity_id: 'COMPROVANTE_DE_SOLICITACAO_DE_HABITESE',
    parent_record_id: null, source_document: 'DOC_CURRENT',
    attributes: {
      PROTOCOL_IDENTIFIER: 'TEST_ONLY_PROTOCOL', REQUEST_DATE: requestDate,
      RE_IDENTIFIER: 'TEST_ONLY_RE'
    },
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_DOCUMENT' }
  }, {
    record_id: 'SECTION_CURRENT', entity_id: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA',
    parent_record_id: 'DOC_CURRENT', source_document: 'DOC_CURRENT',
    attributes: { STRUCTURALLY_COMPLETE: true, LEGIBLE: true, VERIFIABLE: true },
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_SECTION' }
  }];
  if (includeGas) {
    records.push({
      record_id: 'ITEM_GAS', entity_id: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA_ITEM',
      parent_record_id: 'SECTION_CURRENT', source_document: 'DOC_CURRENT',
      attributes: {
        OFFICIAL_ESCI_CODE: 'IGC',
        PRESENTED_SYSTEM_MEASURE_DESCRIPTION: 'TEST_ONLY gas',
        RPCI_ORIENTATIVE_TEXT: 'TEST_ONLY', SOURCE_LOCATION: 'TEST_ONLY page'
      },
      provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_GAS_ITEM' }
    });
  }
  if (includeIel) {
    records.push({
      record_id: 'ITEM_IEL', entity_id: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA_ITEM',
      parent_record_id: 'SECTION_CURRENT', source_document: 'DOC_CURRENT',
      attributes: {
        OFFICIAL_ESCI_CODE: 'IEL',
        PRESENTED_SYSTEM_MEASURE_DESCRIPTION: 'TEST_ONLY low-voltage installation',
        RPCI_ORIENTATIVE_TEXT: 'TEST_ONLY', SOURCE_LOCATION: 'TEST_ONLY page'
      },
      provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_IEL_ITEM' }
    });
  }
  if (includePressurization) {
    records.push({
      record_id: 'ITEM_PRESSURIZATION', entity_id: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA_ITEM',
      parent_record_id: 'SECTION_CURRENT', source_document: 'DOC_CURRENT',
      attributes: {
        OFFICIAL_ESCI_CODE: 'SPDE',
        PRESENTED_SYSTEM_MEASURE_DESCRIPTION: 'TEST_ONLY pressurization system',
        RPCI_ORIENTATIVE_TEXT: 'TEST_ONLY', SOURCE_LOCATION: 'TEST_ONLY page'
      },
      provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_PRESSURIZATION_ITEM' }
    });
  }
  if (includeLegacyExecutionDrt) {
    records.push({
      record_id: 'DOC_DRT', entity_id: 'DRT', parent_record_id: null,
      source_document: 'DOC_DRT', attributes: {},
      provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_DRT_DOCUMENT' }
    });
    records.push({
      record_id: 'DRT_LOW_VOLTAGE', entity_id: 'LOW_VOLTAGE_EXECUTION_DRT',
      parent_record_id: null, source_document: 'DOC_DRT', attributes: {},
      provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_LOW_VOLTAGE_DRT' }
    });
  }
  if (includeManual) {
    records.push({
      record_id: 'DOC_MANUAL', entity_id: 'MANUAL',
      parent_record_id: null, source_document: 'DOC_MANUAL', attributes: {},
      provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_MANUAL_DOCUMENT' }
    }, {
      record_id: 'MANUAL_CLASSIFICATION', entity_id: 'GAS_OWNER_MANUAL',
      parent_record_id: null, source_document: 'DOC_MANUAL', attributes: {},
      provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_MANUAL_CLASSIFICATION' }
    });
  }
  if (includePressurizationManual) {
    records.push({
      record_id: 'DOC_PRESSURIZATION_MANUAL', entity_id: 'MANUAL',
      parent_record_id: null, source_document: 'DOC_PRESSURIZATION_MANUAL', attributes: {},
      provenance: {
        sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_PRESSURIZATION_MANUAL_DOCUMENT'
      }
    }, {
      record_id: 'PRESSURIZATION_MANUAL_CLASSIFICATION',
      entity_id: 'PRESSURIZATION_OPERATION_MANUAL',
      parent_record_id: null, source_document: 'DOC_PRESSURIZATION_MANUAL', attributes: {},
      provenance: {
        sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_PRESSURIZATION_MANUAL_CLASSIFICATION'
      }
    });
  }
  return { schema_version: '0.2.0', records };
}

function prepare(options) {
  const rde = makeRde(options);
  const view = api.projectRdeToExecutionView_(rde, contract.entityCatalog);
  const resolution = api.resolveCbmscApplicability(
    view, currentContext(options && options.requestDate), contract
  );
  const plan = api.materializeFrozenExecutionPlan(contract, resolution, view);
  return { rde, view, resolution, plan };
}

const pilotMetadata = contract.criteria.find(item => item.criterionId === 'T4_IN08_MANUAL');
assert.deepEqual(JSON.parse(JSON.stringify(pilotMetadata.assertIr)), {
  type: 'CALL', name: 'EXISTS',
  arguments: [{ type: 'SYMBOL', value: 'GAS_OWNER_MANUAL' }]
});
assert.equal(pilotMetadata.sourceFile, '04_table4.txt');
assert.deepEqual(JSON.parse(JSON.stringify(pilotMetadata.failNonconformities)), ['NC_T4_003']);

const positive = prepare({ includeGas: true, includeManual: true });
assert.equal(positive.plan.PLANNED_EXECUTION_UNITS.some(unit => unit.unitKey === PILOT_UNIT), true);
const positiveMaterialized = api.materializePlannedCriterion(
  contract, positive.plan, PILOT_UNIT, positive.view
);
assert.equal(positiveMaterialized.criterion.criterionId, 'T4_IN08_MANUAL');
assert.equal(positiveMaterialized.binding.entityId, 'GAS_OWNER_MANUAL');
assert.equal(positiveMaterialized.binding.matchedCount, 1);
assert.deepEqual(JSON.parse(JSON.stringify(positiveMaterialized.binding.sourceDocument)),
  { kind: 'DOCUMENT', identifier: 'DOC_MANUAL' });
const positiveResult = api.executePlannedCriterion(contract, positive.plan, PILOT_UNIT, positive.view);
assert.equal(positiveResult.unitKey, PILOT_UNIT);
assert.equal(positiveResult.engineResult, api.EngineResult.TRUE);
assert.equal(positiveResult.pipelineResult, 'PASS');
assert.equal(positiveResult.resultOrigin, 'EVALUATED');
assert.equal(positiveResult.trace[0].predicateId, 'EXISTS');
assert.deepEqual(JSON.parse(JSON.stringify(positiveResult.trace[0].memoryReferences)), [
  { kind: 'MANUAL', identifier: 'MANUAL_CLASSIFICATION' }
]);
assert.equal(Object.hasOwn(positiveResult, 'nonconformityOnFalse'), false);
assert.equal(positiveResult.traceability.declarationSource, '04_table4.txt');
assert.equal(positiveResult.traceability.unitKey, PILOT_UNIT);

const negative = prepare({ includeGas: true, includeManual: false });
const negativeResult = api.executePlannedCriterion(contract, negative.plan, PILOT_UNIT, negative.view);
assert.equal(negativeResult.unitKey, PILOT_UNIT);
assert.equal(negativeResult.engineResult, api.EngineResult.FALSE);
assert.equal(negativeResult.pipelineResult, 'FAIL');
assert.equal(negativeResult.nonconformityOnFalse, 'NC_T4_003');
assert.deepEqual(JSON.parse(JSON.stringify(negativeResult.trace[0].memoryReferences)), [
  { kind: 'DOCUMENT_ABSENCE', identifier: 'GAS_OWNER_MANUAL' }
]);
assert.deepEqual(JSON.parse(JSON.stringify(negativeResult.traceability.documentaryBinding.sourceDocument)),
  { kind: 'DOCUMENT_ABSENCE', identifier: 'GAS_OWNER_MANUAL' });

assert.equal(
  contract.entityCatalog.PRESSURIZATION_OPERATION_MANUAL.TYPE,
  'MANUAL'
);
const pressurizationManual = prepare({
  includeGas: false,
  includePressurization: true,
  includePressurizationManual: true
});
assert.equal(
  pressurizationManual.plan.PLANNED_EXECUTION_UNITS.some(
    unit => unit.unitKey === PRESSURIZATION_MANUAL_UNIT
  ),
  true
);
const pressurizationManualResult = api.executePlannedCriterion(
  contract, pressurizationManual.plan, PRESSURIZATION_MANUAL_UNIT,
  pressurizationManual.view
);
assert.equal(pressurizationManualResult.engineResult, api.EngineResult.TRUE);
assert.equal(pressurizationManualResult.pipelineResult, 'PASS');
assert.equal(pressurizationManualResult.resultOrigin, 'EVALUATED');
assert.deepEqual(
  JSON.parse(JSON.stringify(pressurizationManualResult.trace[0].memoryReferences)),
  [{ kind: 'MANUAL',
    identifier: 'PRESSURIZATION_MANUAL_CLASSIFICATION' }]
);
assert.equal(
  pressurizationManualResult.traceability.unitKey,
  PRESSURIZATION_MANUAL_UNIT
);
assert.deepEqual(
  JSON.parse(JSON.stringify(
    pressurizationManualResult.traceability.documentaryBinding.sourceDocument
  )),
  { kind: 'DOCUMENT', identifier: 'DOC_PRESSURIZATION_MANUAL' }
);
const pressurizationManualReference = new api.TypedReference(
  'MANUAL', 'PRESSURIZATION_MANUAL_CLASSIFICATION'
);
const pressurizationManualProvenance =
  pressurizationManual.view.provenance(pressurizationManualReference);
assert.deepEqual(JSON.parse(JSON.stringify(pressurizationManualProvenance)), {
  sourceKind: 'TEST_ONLY',
  sourceReference: 'TEST_ONLY_PRESSURIZATION_MANUAL_CLASSIFICATION'
});
assert.equal(Object.isFrozen(pressurizationManualProvenance), true);

const missingPressurizationManual = prepare({
  includeGas: false,
  includePressurization: true,
  includePressurizationManual: false
});
const missingPressurizationManualResult = api.executePlannedCriterion(
  contract, missingPressurizationManual.plan, PRESSURIZATION_MANUAL_UNIT,
  missingPressurizationManual.view
);
assert.equal(missingPressurizationManualResult.engineResult, api.EngineResult.FALSE);
assert.equal(missingPressurizationManualResult.pipelineResult, 'FAIL');
assert.equal(missingPressurizationManualResult.nonconformityOnFalse, 'NC_T4_006');
assert.deepEqual(
  JSON.parse(JSON.stringify(missingPressurizationManualResult.trace[0].memoryReferences)),
  [{ kind: 'DOCUMENT_ABSENCE', identifier: 'PRESSURIZATION_OPERATION_MANUAL' }]
);
const wrongManualEntity = prepare({
  includeGas: false,
  includeManual: true,
  includePressurization: true,
  includePressurizationManual: false
});
const wrongManualEntityResult = api.executePlannedCriterion(
  contract, wrongManualEntity.plan, PRESSURIZATION_MANUAL_UNIT,
  wrongManualEntity.view
);
assert.equal(wrongManualEntityResult.engineResult, api.EngineResult.FALSE);
assert.equal(wrongManualEntityResult.nonconformityOnFalse, 'NC_T4_006');
assert.deepEqual(
  JSON.parse(JSON.stringify(wrongManualEntityResult.trace[0].memoryReferences)),
  [{ kind: 'DOCUMENT_ABSENCE', identifier: 'PRESSURIZATION_OPERATION_MANUAL' }]
);

const pressurizationNotApplicable = prepare({ includeGas: false });
assert.equal(
  pressurizationNotApplicable.plan.PLANNED_EXECUTION_UNITS.some(
    unit => unit.unitKey === PRESSURIZATION_MANUAL_UNIT
  ),
  false
);
assert.throws(() => api.executePlannedCriterion(
  contract, pressurizationNotApplicable.plan, PRESSURIZATION_MANUAL_UNIT,
  pressurizationNotApplicable.view
), error => error && error.code === 'CRITERION_EXECUTION_INTEGRITY_ERROR');
const presentManualNotApplicable = prepare({
  includeGas: false,
  includePressurization: false,
  includePressurizationManual: true
});
assert.equal(
  presentManualNotApplicable.plan.PLANNED_EXECUTION_UNITS.some(
    unit => unit.unitKey === PRESSURIZATION_MANUAL_UNIT
  ),
  false
);
assert.throws(() => api.executePlannedCriterion(
  contract, presentManualNotApplicable.plan, PRESSURIZATION_MANUAL_UNIT,
  presentManualNotApplicable.view
), error => error && error.code === 'CRITERION_EXECUTION_INTEGRITY_ERROR');

const repeat = api.executePlannedCriterion(contract, negative.plan, PILOT_UNIT, negative.view);
assert.deepEqual(JSON.parse(JSON.stringify(repeat)), JSON.parse(JSON.stringify(negativeResult)));
assert.equal(Object.isFrozen(negativeResult), true);
assert.equal(Object.isFrozen(negativeResult.traceability), true);

const notApplicable = prepare({ includeGas: false, includeManual: true });
assert.equal(notApplicable.plan.PLANNED_EXECUTION_UNITS.some(unit => unit.unitKey === PILOT_UNIT), false);
assert.throws(() => api.executePlannedCriterion(
  contract, notApplicable.plan, PILOT_UNIT, notApplicable.view
), error => error && error.code === 'CRITERION_EXECUTION_INTEGRITY_ERROR');

const reviewUnit = 'UNIT_KEY (REQ_IN19_APPLICABILITY_REVIEW, T4_IN19_APPLICABILITY_REVIEW)';
const applicabilityReview = prepare({ includeGas: true, includeIel: false });
assert.equal(applicabilityReview.plan.PLANNED_EXECUTION_UNITS.some(
  unit => unit.unitKey === reviewUnit
), true);
const reviewResult = api.executePlannedCriterion(
  contract, applicabilityReview.plan, reviewUnit, applicabilityReview.view
);
assert.equal(reviewResult.engineResult, api.EngineResult.MANUAL_REVIEW);
assert.equal(reviewResult.pipelineResult, 'MANUAL_REVIEW');
assert.equal(reviewResult.normalization, 'IDENTITY');
assert.equal(reviewResult.resultOrigin, 'EVALUATED');
assert.equal(reviewResult.trace.length, 1);
assert.equal(reviewResult.trace[0].predicateId, 'ASSERT_LITERAL');
assert.deepEqual(JSON.parse(JSON.stringify(reviewResult.trace[0].arguments)),
  { value: 'MANUAL_REVIEW' });
assert.deepEqual(JSON.parse(JSON.stringify(reviewResult.trace[0].argumentReferences)), []);
assert.deepEqual(JSON.parse(JSON.stringify(reviewResult.trace[0].memoryReferences)), [
  { kind: 'DOCUMENT', identifier: 'DOC_CURRENT' },
  { kind: 'DOCUMENT_SECTION', identifier: 'SECTION_CURRENT' }
]);
assert.equal(reviewResult.trace[0].criterionId, 'T4_IN19_APPLICABILITY_REVIEW');
assert.equal(reviewResult.trace[0].requirementId, 'REQ_IN19_APPLICABILITY_REVIEW');
assert.equal(reviewResult.traceability.documentaryBinding.applicabilityDerivation.target,
  'SMSCI_IN19_APPLICABILITY_REVIEW');
assert.equal(reviewResult.traceability.documentaryBinding.applicabilityDerivation.sourceDecisionTraces[0].target,
  'SMSCI_IEL');
assert.equal(reviewResult.traceability.documentaryBinding.applicabilityDerivation.sourceDecisionTraces[0].decision,
  'NEGATIVE');
assert.equal(reviewResult.nonconformityOnFalse, undefined);
assert.throws(() => api.executePlannedCriterion(
  contract, applicabilityReview.plan, reviewUnit, positive.view
), error => error && error.code === 'CRITERION_EXECUTION_INTEGRITY_ERROR');

const legacyUnit = 'UNIT_KEY (REQ_IN19_LEGACY_DOCUMENTATION, T4_IN19_LEGACY_DOCUMENTATION)';
const legacyManual = prepare({
  includeGas: true, includeIel: true, requestDate: '2024-04-24'
});
assert.equal(legacyManual.plan.PLANNED_EXECUTION_UNITS.some(
  unit => unit.unitKey === legacyUnit
), true);
const legacyManualResult = api.executePlannedCriterion(
  contract, legacyManual.plan, legacyUnit, legacyManual.view
);
assert.equal(legacyManualResult.engineResult, api.EngineResult.MANUAL_REVIEW);
assert.equal(legacyManualResult.pipelineResult, 'MANUAL_REVIEW');
assert.equal(legacyManualResult.normalization, 'IDENTITY');
assert.deepEqual(JSON.parse(JSON.stringify(legacyManualResult.trace.map(item => item.predicateId))),
  ['EXISTS', 'ASSERT_LITERAL']);
assert.deepEqual(JSON.parse(JSON.stringify(legacyManualResult.trace[0].memoryReferences)), [
  { kind: 'DOCUMENT_ABSENCE', identifier: 'LOW_VOLTAGE_EXECUTION_DRT' }
]);
assert.equal(legacyManualResult.trace[1].result, 'MANUAL_REVIEW');
assert.deepEqual(JSON.parse(JSON.stringify(legacyManualResult.trace[1].memoryReferences)), [
  { kind: 'DOCUMENT', identifier: 'DOC_CURRENT' }
]);
assert.equal(legacyManualResult.nonconformityOnFalse, undefined);

const legacyDocumented = prepare({
  includeGas: true, includeIel: true, includeLegacyExecutionDrt: true,
  requestDate: '2024-04-24'
});
const legacyDocumentedResult = api.executePlannedCriterion(
  contract, legacyDocumented.plan, legacyUnit, legacyDocumented.view
);
assert.equal(legacyDocumentedResult.engineResult, api.EngineResult.TRUE);
assert.equal(legacyDocumentedResult.pipelineResult, 'PASS');
assert.deepEqual(JSON.parse(JSON.stringify(legacyDocumentedResult.trace.map(item => item.predicateId))),
  ['EXISTS', 'ASSERT_LITERAL']);
assert.equal(legacyDocumentedResult.trace[0].result, 'TRUE');
assert.equal(legacyDocumentedResult.trace[1].result, 'MANUAL_REVIEW');
assert.equal(legacyDocumentedResult.nonconformityOnFalse, undefined);

const legacyCurrent = prepare({
  includeGas: true, includeIel: true, requestDate: '2024-04-25'
});
assert.equal(legacyCurrent.plan.PLANNED_EXECUTION_UNITS.some(
  unit => unit.unitKey === legacyUnit
), false);
assert.throws(() => api.executePlannedCriterion(
  contract, legacyCurrent.plan, legacyUnit, legacyCurrent.view
), error => error && error.code === 'CRITERION_EXECUTION_INTEGRITY_ERROR');

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.keys(value).forEach(key => deepFreeze(value[key]));
  return Object.freeze(value);
}

const alternatePositive = prepare({ includeGas: true, includeManual: true });
assert.throws(() => api.executePlannedCriterion(
  contract, positive.plan, PILOT_UNIT, alternatePositive.view
), error => error && error.code === 'CRITERION_EXECUTION_INTEGRITY_ERROR');

const forgedPlan = deepFreeze(JSON.parse(JSON.stringify(negative.plan)));
assert.equal(Object.isFrozen(forgedPlan.PLANNED_EXECUTION_UNITS), true);
assert.throws(() => api.executePlannedCriterion(
  contract, forgedPlan, PILOT_UNIT, negative.view
), error => error && error.code === 'CRITERION_EXECUTION_INTEGRITY_ERROR');

const tamperedContract = JSON.parse(JSON.stringify(contract));
const tamperedCriterion = tamperedContract.criteria.find(item => item.criterionId === 'T4_IN08_MANUAL');
tamperedCriterion.assertIr.arguments[0].value = 'MANUAL';
deepFreeze(tamperedContract);
assert.equal(Object.isFrozen(tamperedContract.criteria), true);
assert.throws(() => api.executePlannedCriterion(
  tamperedContract, positive.plan, PILOT_UNIT, positive.view
), error => error && error.code === 'CRITERION_EXECUTION_INTEGRITY_ERROR');

const moduleSource = fs.readFileSync(
  path.join(__dirname, '../apps-script/CriterionExecutionCore.js'), 'utf8'
);
for (const forbidden of [
  'DriveApp', 'SpreadsheetApp', 'PropertiesService', 'UrlFetchApp',
  'Gemini', 'OpenAI', 'getRawRde', 'getRde'
]) assert.equal(moduleSource.includes(forbidden), false);
assert.equal(moduleSource.includes('T4_IN08_MANUAL'), false);
assert.equal(moduleSource.includes('REQ_IN08_MANUAL'), false);
assert.equal(moduleSource.includes('NC_T4_003'), false);

console.log('apps-script-pilot-criterion: PASS');
