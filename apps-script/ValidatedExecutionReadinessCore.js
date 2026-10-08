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

function readinessAssertSupported_(assertIr, contract, validatedProduct) {
  if (!assertIr || typeof assertIr !== 'object' || Array.isArray(assertIr)) return false;
  if (assertIr.type === 'LITERAL') {
    return Object.keys(assertIr).sort().join(',') === 'type,value' &&
      assertIr.value === 'MANUAL_REVIEW';
  }
  if (assertIr.type === 'OR') {
    return Object.keys(assertIr).sort().join(',') === 'expressions,type' &&
      Array.isArray(assertIr.expressions) && assertIr.expressions.length === 2 &&
      assertIr.expressions.every(child =>
        readinessAssertSupported_(child, contract, validatedProduct));
  }
  if (assertIr.type === 'ALL') {
    return Object.keys(assertIr).sort().join(',') === 'expressions,type' &&
      Array.isArray(assertIr.expressions) && assertIr.expressions.length > 0 &&
      assertIr.expressions.every(child =>
        readinessAssertSupported_(child, contract, validatedProduct));
  }
  if (assertIr.type !== 'CALL' ||
      Object.keys(assertIr).sort().join(',') !== 'arguments,name,type') return false;

  if (assertIr.name === 'TECHNICAL_PRODUCT_ATTRIBUTE') {
    if (!validatedProduct || !Array.isArray(assertIr.arguments) ||
        assertIr.arguments.length !== 2) return false;
    const [product, attribute] = assertIr.arguments;
    const entity = contract.entityCatalog && contract.entityCatalog[validatedProduct];
    return product && product.type === 'SYMBOL' && product.value === validatedProduct &&
      attribute && attribute.type === 'SYMBOL' && attribute.value === 'SIGNED' &&
      entity && Array.isArray(entity.ATTRIBUTES) &&
      entity.ATTRIBUTES.includes('SIGNATURE_MECHANISM') && entity.ATTRIBUTE_TYPES &&
      entity.ATTRIBUTE_TYPES.SIGNATURE_MECHANISM === 'TEXT';
  }
  if (assertIr.name !== 'EXISTS') return false;

  readinessRequire_(Array.isArray(assertIr.arguments) && assertIr.arguments.length === 1,
    'COMPILED_CONTRACT_INVALID', 'canonical EXISTS assertion must have exactly one argument');
  const argument = assertIr.arguments[0];
  readinessRequire_(argument && typeof argument === 'object' && !Array.isArray(argument) &&
    Object.keys(argument).sort().join(',') === 'type,value' &&
    argument.type === 'SYMBOL' && typeof argument.value === 'string' && argument.value &&
    contract.entityCatalog && contract.entityCatalog[argument.value] &&
    (validatedProduct === null || argument.value === validatedProduct),
  'COMPILED_CONTRACT_INVALID', 'canonical EXISTS assertion has an invalid entity symbol');
  return true;
}

function readinessPilotSupport_(unit, contract) {
  if (unit.iterationSource !== null || !Array.isArray(unit.plannedBindings) ||
      unit.plannedBindings.length !== 0 || !Array.isArray(unit.validate) ||
      !Array.isArray(unit.criterionValidate) ||
      unit.criterionValidate.length !== 0) {
    return false;
  }

  const matches = contract.criteria.filter(item =>
    item && item.criterionId === unit.criterion.id
  );
  readinessRequire_(matches.length === 1,
    'COMPILED_CONTRACT_INVALID', 'planned Criterion must exist exactly once');
  const metadata = matches[0];
  let validatedProduct = null;
  if (unit.validate.length > 0) {
    if (unit.validate.length !== 1 ||
        unit.validate[0] !== 'TECHNICAL_PRODUCT_ATTRIBUTE') return false;
    const requirementMatches = contract.requirements.filter(item =>
      item && item.requirementId === unit.requirement.id);
    if (requirementMatches.length !== 1) {
      readinessRequire_(false, 'COMPILED_CONTRACT_INVALID',
        'planned Requirement must exist exactly once');
    }
    const requirement = requirementMatches[0];
    const relatedCriteria = contract.criteria.filter(item =>
      item && item.requirementId === unit.requirement.id);
    if (!Array.isArray(requirement.validate) ||
        JSON.stringify(requirement.validate) !== JSON.stringify(unit.validate) ||
        relatedCriteria.length !== 1 || relatedCriteria[0].criterionId !== unit.criterion.id ||
        typeof requirement.technicalProduct !== 'string' ||
        !Array.isArray(requirement.evidenceAttributes) ||
        requirement.evidenceAttributes.length !== 1 ||
        requirement.evidenceAttributes[0] !== 'SIGNED') return false;
    validatedProduct = requirement.technicalProduct;
  }
  const assertIr = metadata.assertIr;
  if (!readinessAssertSupported_(assertIr, contract, validatedProduct)) return false;

  const nonconformities = unit.nonconformityReferences &&
    unit.nonconformityReferences.criterionFail;
  readinessRequire_(Array.isArray(nonconformities),
    'PLAN_INVALID', 'planned Criterion FAIL references must be an array');
  if (nonconformities.length > 1) return false;
  return true;
}

function readinessInspectPlan_(plan, contract, view) {
  const plannedUnitKeys = [];
  const materializableUnitKeys = [];
  const unsupportedUnitKeys = [];
  for (const unit of plan.PLANNED_EXECUTION_UNITS) {
    plannedUnitKeys.push(unit.unitKey);
    if (!readinessPilotSupport_(unit, contract)) {
      unsupportedUnitKeys.push(unit.unitKey);
      continue;
    }
    // Materialization checks integrity for supported units but evaluates no Criterion.
    // Any error here is an integrity failure and must retain its original code/message.
    materializePlannedCriterion(contract, plan, unit.unitKey, view);
    materializableUnitKeys.push(unit.unitKey);
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
    readinessRequire_(typeof global.isSupportedRdeSchemaVersion_ === 'function' &&
      global.isSupportedRdeSchemaVersion_(processRecord.rdeVersion),
    'RDE_VERSION_MISMATCH', 'validated registry record has no supported RDE_VERSION');

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
    readinessRequire_(rde.schema_version === processRecord.rdeVersion,
      'RDE_VERSION_MISMATCH', 'validated RDE schema_version does not match registry RDE_VERSION');

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
