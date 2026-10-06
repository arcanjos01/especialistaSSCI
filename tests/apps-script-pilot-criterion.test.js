const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const contract = require('../apps-script/CompiledRuntimeContract.js');

const context = {};
vm.createContext(context);
for (const relativePath of [
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

const PILOT_UNIT = 'UNIT_KEY (REQ_IN08_MANUAL, T4_IN08_MANUAL)';

function currentContext() {
  return api.createCurrentSubmissionContext({
    protocolIdentifier: 'TEST_ONLY_PROTOCOL',
    requestDate: '2026-01-28',
    reIdentifier: 'TEST_ONLY_RE',
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_INTAKE' }
  });
}

function makeRde({ includeGas = true, includeManual = false } = {}) {
  const records = [{
    record_id: 'DOC_CURRENT', entity_id: 'COMPROVANTE_DE_SOLICITACAO_DE_HABITESE',
    parent_record_id: null, source_document: 'DOC_CURRENT',
    attributes: {
      PROTOCOL_IDENTIFIER: 'TEST_ONLY_PROTOCOL', REQUEST_DATE: '2026-01-28',
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
  return { schema_version: '0.2.0', records };
}

function prepare(options) {
  const rde = makeRde(options);
  const view = api.projectRdeToExecutionView_(rde, contract.entityCatalog);
  const resolution = api.resolveCbmscApplicability(view, currentContext(), contract);
  const plan = api.materializeFrozenExecutionPlan(contract, resolution);
  return { rde, view, resolution, plan };
}

const pilotMetadata = contract.criteria.find(item => item.criterionId === 'T4_IN08_MANUAL');
assert.deepEqual(JSON.parse(JSON.stringify(pilotMetadata.assertIr)), {
  type: 'CALL', name: 'EXISTS',
  arguments: [{ type: 'SYMBOL', value: 'GAS_OWNER_MANUAL' }]
});
assert.equal(pilotMetadata.sourceFile, '04_table4.txt');
assert.deepEqual(pilotMetadata.failNonconformities, ['NC_T4_003']);

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

const repeat = api.executePlannedCriterion(contract, negative.plan, PILOT_UNIT, negative.view);
assert.deepEqual(JSON.parse(JSON.stringify(repeat)), JSON.parse(JSON.stringify(negativeResult)));
assert.equal(Object.isFrozen(negativeResult), true);
assert.equal(Object.isFrozen(negativeResult.traceability), true);

const notApplicable = prepare({ includeGas: false, includeManual: true });
assert.equal(notApplicable.plan.PLANNED_EXECUTION_UNITS.some(unit => unit.unitKey === PILOT_UNIT), false);
assert.throws(() => api.executePlannedCriterion(
  contract, notApplicable.plan, PILOT_UNIT, notApplicable.view
), error => error && error.code === 'CRITERION_EXECUTION_INTEGRITY_ERROR');

const tamperedPlan = JSON.parse(JSON.stringify(negative.plan));
const tamperedUnit = tamperedPlan.PLANNED_EXECUTION_UNITS.find(unit => unit.unitKey === PILOT_UNIT);
tamperedUnit.nonconformityReferences.criterionFail = [];
assert.throws(() => api.executePlannedCriterion(
  contract, tamperedPlan, PILOT_UNIT, negative.view
), error => error && error.code === 'CRITERION_EXECUTION_INTEGRITY_ERROR');

const tamperedContract = JSON.parse(JSON.stringify(contract));
const tamperedCriterion = tamperedContract.criteria.find(item => item.criterionId === 'T4_IN08_MANUAL');
tamperedCriterion.assertIr.arguments[0].value = 'TEST_ONLY_UNKNOWN_ENTITY';
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
