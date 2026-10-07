(function (global) {
'use strict';
/** Read-only preparation gate; it never executes, persists results, or changes workflow state. */

class ValidatedExecutionReadinessError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ValidatedExecutionReadinessError';
    this.code = code;
  }
}

function readinessRequire_(condition, code, message) {
  if (!condition) throw new ValidatedExecutionReadinessError(code, message);
}

function readinessSnapshot_(value) {
  return JSON.stringify(value);
}

function readinessFreeze_(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.keys(value).forEach(key => readinessFreeze_(value[key]));
  return Object.freeze(value);
}

function readinessInspectPlan_(plan, contract, view) {
  const plannedUnitKeys = [];
  const materializableUnitKeys = [];
  const unsupportedUnitKeys = [];
  for (const unit of plan.PLANNED_EXECUTION_UNITS) {
    plannedUnitKeys.push(unit.unitKey);
    try {
      // Materialization checks the approved executor boundary but evaluates no Criterion.
      materializePlannedCriterion(contract, plan, unit.unitKey, view);
      materializableUnitKeys.push(unit.unitKey);
    } catch (error) {
      if (!error || error.code !== 'CRITERION_EXECUTION_INTEGRITY_ERROR') throw error;
      unsupportedUnitKeys.push(unit.unitKey);
    }
  }
  return readinessFreeze_({ plannedUnitKeys, materializableUnitKeys, unsupportedUnitKeys });
}

/**
 * Builds a read-only readiness snapshot from a VALIDATED registry record and its RDE JSON.
 * The adapter surface is deliberately read-only; callers supply a lock for consistent reads.
 */
function prepareValidatedExecutionReadiness(processId, currentSubmissionContext, adapters) {
  readinessRequire_(typeof processId === 'string' && processId.trim(),
    'PROCESS_ID_INVALID', 'processId must be a non-empty string');
  readinessRequire_(adapters && typeof adapters.withLock === 'function' &&
    typeof adapters.readProcess === 'function' &&
    typeof adapters.readValidatedRde === 'function',
  'READ_ADAPTER_INVALID', 'read-only lock and registry/RDE adapters are required');

  return adapters.withLock(() => {
    const processRecord = adapters.readProcess(processId);
    readinessRequire_(processRecord && processRecord.processId === processId,
      'PROCESS_NOT_FOUND', 'process registry record was not found');
    if (processRecord.status === 'ANALYZED') {
      return readinessFreeze_({
        outcome: 'ALREADY_ANALYZED',
        processId,
        workflowStatus: 'ANALYZED',
        analysisPermitted: false,
      });
    }
    readinessRequire_(processRecord.status === 'VALIDATED',
      'PROCESS_STATUS_NOT_VALIDATED', 'process must remain VALIDATED for preparation');
    readinessRequire_(typeof processRecord.sourceFileId === 'string' &&
      processRecord.sourceFileId.trim(),
    'PROCESS_SOURCE_ID_MISSING', 'validated registry record has no SOURCE_FILE_ID');

    const rdeContent = adapters.readValidatedRde(processRecord);
    readinessRequire_(typeof rdeContent === 'string' && rdeContent.length > 0,
      'RDE_MISSING', 'validated RDE content is missing');
    let rde;
    try {
      rde = JSON.parse(rdeContent);
    } catch (error) {
      throw new ValidatedExecutionReadinessError('RDE_INVALID', 'validated RDE is not valid JSON');
    }

    const contract = global.COMPILED_RUNTIME_CONTRACT;
    readinessRequire_(typeof global.isCanonicalCompiledRuntimeContract === 'function' &&
      global.isCanonicalCompiledRuntimeContract(contract),
    'COMPILED_CONTRACT_INVALID', 'canonical compiled runtime contract is required');

    const originalRdeSnapshot = readinessSnapshot_(rde);
    try {
      global.validateRdeStructure_(rde, {
        processId,
        sourceFileId: processRecord.sourceFileId,
      }, contract.entityCatalog);
    } catch (error) {
      throw new ValidatedExecutionReadinessError(
        'RDE_INVALID', error && error.message ? error.message : 'validated RDE failed structural validation'
      );
    }

    let view;
    let context;
    let resolution;
    let plan;
    try {
      view = global.projectRdeToExecutionView_(rde, contract.entityCatalog);
      context = global.createCurrentSubmissionContext(currentSubmissionContext);
      resolution = global.resolveCbmscApplicability(view, context, contract);
      plan = global.materializeFrozenExecutionPlan(contract, resolution, view);
    } catch (error) {
      throw new ValidatedExecutionReadinessError(
        error && error.code ? error.code : 'EXECUTION_PREPARATION_FAILED',
        error && error.message ? error.message : 'execution preparation failed'
      );
    }

    readinessRequire_(readinessSnapshot_(rde) === originalRdeSnapshot,
      'RDE_MUTATED', 'preparation changed the validated RDE');
    const coverage = readinessInspectPlan_(plan, contract, view);

    return readinessFreeze_({
      outcome: coverage.unsupportedUnitKeys.length
        ? 'EXECUTION_COVERAGE_INCOMPLETE'
        : 'PREPARATION_ONLY',
      processId,
      workflowStatus: 'VALIDATED',
      analysisPermitted: false,
      resultRecordsCreated: 0,
      artifactsPersisted: false,
      rdeMutated: false,
      coverage,
    });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ValidatedExecutionReadinessError,
    prepareValidatedExecutionReadiness,
  };
}

Object.defineProperty(global, 'ValidatedExecutionReadinessError', {
  value: ValidatedExecutionReadinessError, enumerable: true, writable: false, configurable: false
});
Object.defineProperty(global, 'prepareValidatedExecutionReadiness', {
  value: prepareValidatedExecutionReadiness, enumerable: true, writable: false, configurable: false
});
})(globalThis);
