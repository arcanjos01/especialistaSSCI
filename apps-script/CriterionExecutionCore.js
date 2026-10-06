/** Phase 4 bridge from a frozen planned unit to the generic Criterion IR engine. */

class CriterionExecutionIntegrityError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CriterionExecutionIntegrityError';
    this.code = 'CRITERION_EXECUTION_INTEGRITY_ERROR';
  }
}

function criterionExecutionRequire_(condition, message) {
  if (!condition) throw new CriterionExecutionIntegrityError(message);
}

function criterionExecutionReferenceSnapshot_(reference) {
  return Object.freeze({ kind: reference.kind, identifier: reference.identifier });
}

function criterionExecutionFindUnit_(plan, unitKey) {
  criterionExecutionRequire_(plan && Array.isArray(plan.PLANNED_EXECUTION_UNITS),
    'frozen execution plan is required');
  criterionExecutionRequire_(typeof unitKey === 'string' && unitKey,
    'unitKey must be a non-empty string');
  const matches = plan.PLANNED_EXECUTION_UNITS.filter(unit => unit && unit.unitKey === unitKey);
  criterionExecutionRequire_(matches.length === 1,
    'planned unit must exist exactly once: ' + unitKey);
  return matches[0];
}

function criterionExecutionFindCriterion_(contract, criterionId) {
  criterionExecutionRequire_(contract && contract.contractVersion === 1 && Array.isArray(contract.criteria),
    'compiled runtime contract is invalid');
  const matches = contract.criteria.filter(item => item && item.criterionId === criterionId);
  criterionExecutionRequire_(matches.length === 1,
    'compiled Criterion must exist exactly once: ' + criterionId);
  return matches[0];
}

function criterionExecutionBindExists_(contract, view, argument) {
  criterionExecutionRequire_(argument && argument.type === 'SYMBOL' &&
    typeof argument.value === 'string' && argument.value,
  'EXISTS requires one canonical entity symbol');
  const entityId = argument.value;
  criterionExecutionRequire_(contract.entityCatalog && contract.entityCatalog[entityId],
    'EXISTS references an unknown canonical entity: ' + entityId);
  const references = view.referencesByEntity(entityId);
  criterionExecutionRequire_(Array.isArray(references),
    'execution view returned an invalid entity reference collection');
  if (references.length > 0) {
    const witness = references[0];
    const sourceDocument = view.sourceDocument(witness);
    return Object.freeze({
      expression: new Exists(witness),
      binding: Object.freeze({
        entityId,
        matchedCount: references.length,
        witness: criterionExecutionReferenceSnapshot_(witness),
        sourceDocument: criterionExecutionReferenceSnapshot_(sourceDocument)
      })
    });
  }
  const absence = new TypedReference('DOCUMENT_ABSENCE', entityId);
  return Object.freeze({
    expression: new Exists(absence),
    binding: Object.freeze({
      entityId,
      matchedCount: 0,
      witness: criterionExecutionReferenceSnapshot_(absence),
      sourceDocument: criterionExecutionReferenceSnapshot_(absence)
    })
  });
}

function criterionExecutionMaterializeAssert_(contract, view, assertIr) {
  criterionExecutionRequire_(assertIr && assertIr.type === 'CALL',
    'Phase 4 executor supports only a direct CALL assertion');
  criterionExecutionRequire_(assertIr.name === 'EXISTS',
    'Phase 4 executor supports only the canonical EXISTS operator');
  criterionExecutionRequire_(Array.isArray(assertIr.arguments) && assertIr.arguments.length === 1,
    'EXISTS must declare exactly one argument');
  return criterionExecutionBindExists_(contract, view, assertIr.arguments[0]);
}

function materializePlannedCriterion(contract, plan, unitKey, view) {
  criterionExecutionRequire_(typeof isImmutableExecutionView === 'function' &&
    isImmutableExecutionView(view), 'execution requires an ImmutableExecutionView');
  const unit = criterionExecutionFindUnit_(plan, unitKey);
  criterionExecutionRequire_(unit.criterion && typeof unit.criterion.id === 'string' &&
    unit.requirement && typeof unit.requirement.id === 'string',
  'planned unit has invalid Requirement/Criterion identity');
  const metadata = criterionExecutionFindCriterion_(contract, unit.criterion.id);
  const requirementMatches = Array.isArray(contract.requirements)
    ? contract.requirements.filter(item => item && item.requirementId === unit.requirement.id)
    : [];
  criterionExecutionRequire_(requirementMatches.length === 1,
    'compiled Requirement must exist exactly once: ' + unit.requirement.id);
  const requirementMetadata = requirementMatches[0];
  criterionExecutionRequire_(metadata.requirementId === unit.requirement.id,
    'planned unit disagrees with compiled Requirement/Criterion association');
  criterionExecutionRequire_(metadata.table === unit.criterionTable &&
    requirementMetadata.table === unit.requirementTable,
    'planned unit disagrees with Requirement/Criterion TABLE');
  criterionExecutionRequire_(unit.context ===
    (metadata.context === undefined ? null : metadata.context),
  'planned unit CONTEXT differs from compiled Criterion');
  criterionExecutionRequire_(unit.appliesTo ===
    (metadata.appliesTo === undefined ? null : metadata.appliesTo),
  'planned unit APPLIES_TO differs from compiled Criterion');
  criterionExecutionRequire_(unit.iterationSource === null &&
    Array.isArray(unit.plannedBindings) && unit.plannedBindings.length === 0,
  'Phase 4 pilot does not execute iterative Criteria');
  criterionExecutionRequire_(Array.isArray(unit.validate) && unit.validate.length === 0 &&
    Array.isArray(unit.criterionValidate) && unit.criterionValidate.length === 0,
  'Phase 4 pilot does not execute VALIDATE functions');
  if (metadata.appliesTo !== undefined) {
    criterionExecutionRequire_(Array.isArray(plan.PROCESS_SMSCI) &&
      plan.PROCESS_SMSCI.includes(metadata.appliesTo),
    'planned Criterion APPLIES_TO is not present in PROCESS.SMSCI');
  }
  const materialized = criterionExecutionMaterializeAssert_(contract, view, metadata.assertIr);
  const criterionFail = unit.nonconformityReferences &&
    unit.nonconformityReferences.criterionFail;
  const requirementNonconformities = unit.nonconformityReferences &&
    unit.nonconformityReferences.requirement;
  criterionExecutionRequire_(Array.isArray(criterionFail) &&
    JSON.stringify(criterionFail) === JSON.stringify(metadata.failNonconformities || []),
  'planned FAIL Nonconformities differ from compiled Criterion');
  criterionExecutionRequire_(Array.isArray(requirementNonconformities) &&
    JSON.stringify(requirementNonconformities) ===
      JSON.stringify(requirementMetadata.nonconformities || []),
  'planned Requirement Nonconformities differ from compiled Requirement');
  criterionExecutionRequire_(criterionFail.length <= 1,
    'Criterion IR core supports at most one FAIL Nonconformity');
  const nonconformityOnFalse = criterionFail.length === 1 ? criterionFail[0] : null;
  if (nonconformityOnFalse !== null) {
    const nc = contract.nonconformities && contract.nonconformities[nonconformityOnFalse];
    criterionExecutionRequire_(nc && nc.REF_REQUIREMENT === metadata.requirementId &&
      nc.REF_CRITERION === metadata.criterionId && nc.TABLE === metadata.table,
    'FAIL Nonconformity is inconsistent with the compiled Criterion');
  }
  const criterion = new CriterionIR({
    criterionId: metadata.criterionId,
    requirementId: metadata.requirementId,
    expression: materialized.expression,
    expectedResult: EngineResult.TRUE,
    nonconformityOnFalse,
    traceability: {
      declarationSource: metadata.sourceFile,
      compiledAssertIr: metadata.assertIr,
      unitKey: unit.unitKey,
      documentaryBinding: materialized.binding
    }
  });
  return Object.freeze({ criterion, unit, metadata, binding: materialized.binding });
}

function executePlannedCriterion(contract, plan, unitKey, view) {
  const materialized = materializePlannedCriterion(contract, plan, unitKey, view);
  const result = evaluateCriterion(materialized.criterion, new PredicateRegistry([]), view);
  criterionExecutionRequire_(result.criterionId === materialized.metadata.criterionId &&
    result.requirementId === materialized.metadata.requirementId,
  'Engine result identity differs from the planned Criterion');
  if (result.engineResult === EngineResult.FALSE) {
    criterionExecutionRequire_(result.nonconformityOnFalse &&
      result.nonconformityOnFalse === materialized.criterion.nonconformityOnFalse,
    'FALSE result is missing its declared Nonconformity');
  } else {
    criterionExecutionRequire_(!Object.prototype.hasOwnProperty.call(result, 'nonconformityOnFalse'),
      'non-FALSE result cannot materialize a Nonconformity');
  }
  return result;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CriterionExecutionIntegrityError,
    materializePlannedCriterion,
    executePlannedCriterion,
  };
}
