(function (global) {
'use strict';
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

function criterionExecutionFindUnit_(plan, contract, view, unitKey) {
  criterionExecutionRequire_(typeof isCanonicalFrozenExecutionPlan === 'function' &&
    isCanonicalFrozenExecutionPlan(plan, contract, view),
  'canonical frozen execution plan is required');
  criterionExecutionRequire_(typeof unitKey === 'string' && unitKey,
    'unitKey must be a non-empty string');
  const matches = plan.PLANNED_EXECUTION_UNITS.filter(unit => unit && unit.unitKey === unitKey);
  criterionExecutionRequire_(matches.length === 1,
    'planned unit must exist exactly once: ' + unitKey);
  return matches[0];
}

function criterionExecutionFindCriterion_(contract, criterionId) {
  criterionExecutionRequire_(typeof isCanonicalCompiledRuntimeContract === 'function' &&
    isCanonicalCompiledRuntimeContract(contract),
  'canonical compiled runtime contract is required');
  criterionExecutionRequire_(Object.isFrozen(contract) &&
    contract.contractVersion === 1 && Array.isArray(contract.criteria) &&
    Object.isFrozen(contract.criteria) && Array.isArray(contract.requirements) &&
    Object.isFrozen(contract.requirements),
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

function criterionExecutionBindTechnicalProductAttribute_(contract, view, technicalProduct,
  evidenceAttribute) {
  criterionExecutionRequire_(typeof technicalProduct === 'string' && technicalProduct,
    'TECHNICAL_PRODUCT_ATTRIBUTE requires one canonical technical product');
  criterionExecutionRequire_(evidenceAttribute === 'SIGNED',
    'TECHNICAL_PRODUCT_ATTRIBUTE supports only SIGNED');
  const entity = contract.entityCatalog && contract.entityCatalog[technicalProduct];
  criterionExecutionRequire_(entity && Array.isArray(entity.ATTRIBUTES) &&
    entity.ATTRIBUTES.includes('SIGNATURE_MECHANISM') && entity.ATTRIBUTE_TYPES &&
    entity.ATTRIBUTE_TYPES.SIGNATURE_MECHANISM === 'TEXT',
  'TECHNICAL_PRODUCT_ATTRIBUTE requires declared SIGNATURE_MECHANISM TEXT');
  const references = view.referencesByEntity(technicalProduct);
  criterionExecutionRequire_(Array.isArray(references),
    'execution view returned an invalid technical product reference collection');
  criterionExecutionRequire_(references.length <= 1,
    'TECHNICAL_PRODUCT_ATTRIBUTE does not support multiple technical product records');
  const product = references.length === 1 ? references[0] :
    new TypedReference('DOCUMENT_ABSENCE', technicalProduct);
  if (references.length === 1) {
    criterionExecutionRequire_(product instanceof TypedReference && view.contains(product) &&
      view.entityId(product) === technicalProduct,
    'technical product reference does not match its canonical entity');
  }
  const sourceDocument = references.length === 1 ? view.sourceDocument(product) : product;
  criterionExecutionRequire_(sourceDocument instanceof TypedReference &&
    (references.length === 0 || sourceDocument.kind === 'DOCUMENT'),
  'technical product has an invalid source document');
  return Object.freeze({
    expression: new PredicateCall('TECHNICAL_PRODUCT_ATTRIBUTE', {
      technicalProduct: product, attribute: evidenceAttribute
    }),
    binding: immutableCopy({
      type: 'TECHNICAL_PRODUCT_ATTRIBUTE',
      technicalProduct,
      attribute: evidenceAttribute,
      matchedCount: references.length,
      sourceDocument: criterionExecutionReferenceSnapshot_(sourceDocument),
      provenance: references.length === 0 || view.provenance(product) === undefined
        ? null : view.provenance(product)
    })
  });
}

function criterionExecutionTechnicalProductValidation_(contract, requirementMetadata,
  metadata, unit, view) {
  const validate = requirementMetadata.validate;
  if (!Array.isArray(validate) || validate.length === 0) return null;
  criterionExecutionRequire_(validate.length === 1 &&
    validate[0] === 'TECHNICAL_PRODUCT_ATTRIBUTE' &&
    Array.isArray(unit.validate) && JSON.stringify(unit.validate) === JSON.stringify(validate) &&
    Array.isArray(unit.criterionValidate) && unit.criterionValidate.length === 0,
  'unsupported VALIDATE declaration');
  const related = contract.criteria.filter(item => item &&
    item.requirementId === requirementMetadata.requirementId);
  criterionExecutionRequire_(related.length === 1 && related[0].criterionId === metadata.criterionId,
    'TECHNICAL_PRODUCT_ATTRIBUTE requires exactly one Criterion per Requirement');
  criterionExecutionRequire_(typeof requirementMetadata.technicalProduct === 'string' &&
    Array.isArray(requirementMetadata.evidenceAttributes) &&
    requirementMetadata.evidenceAttributes.length === 1 &&
    requirementMetadata.evidenceAttributes[0] === 'SIGNED',
  'TECHNICAL_PRODUCT_ATTRIBUTE VALIDATE metadata is invalid');
  return criterionExecutionBindTechnicalProductAttribute_(contract, view,
    requirementMetadata.technicalProduct, requirementMetadata.evidenceAttributes[0]);
}

function criterionExecutionProductReferences_(assertIr) {
  const references = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'CALL' &&
        (node.name === 'EXISTS' || node.name === 'TECHNICAL_PRODUCT_ATTRIBUTE')) {
      const args = node.arguments;
      criterionExecutionRequire_(Array.isArray(args) && args.length >= 1 &&
        args[0] && args[0].type === 'SYMBOL' && typeof args[0].value === 'string',
      'ASSERT technical product reference is malformed');
      references.push(args[0].value);
    }
    Object.keys(node).forEach(key => {
      const child = node[key];
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child === 'object') visit(child);
    });
  }
  visit(assertIr);
  return references;
}

function criterionExecutionRequireProductValidationAnchor_(assertIr, technicalProduct) {
  const references = criterionExecutionProductReferences_(assertIr);
  criterionExecutionRequire_(references.length > 0 &&
    references.every(reference => reference === technicalProduct),
  'TECHNICAL_PRODUCT_ATTRIBUTE VALIDATE does not match ASSERT product references');
}

function criterionExecutionDocumentTrace_(view, reference, expectedSourceDocument) {
  criterionExecutionRequire_(reference && typeof reference.kind === 'string' &&
    typeof reference.identifier === 'string', 'applicability trace reference is invalid');
  const typedReference = new TypedReference(reference.kind, reference.identifier);
  criterionExecutionRequire_(view.contains(typedReference),
    'applicability trace reference does not belong to the execution view');
  const sourceDocument = view.sourceDocument(typedReference);
  criterionExecutionRequire_(sourceDocument instanceof TypedReference &&
    sourceDocument.kind === 'DOCUMENT' &&
    sourceDocument.identifier === expectedSourceDocument.identifier,
  'applicability trace reference has a different source document');
  return Object.freeze({
    reference: criterionExecutionReferenceSnapshot_(typedReference),
    sourceDocument: criterionExecutionReferenceSnapshot_(sourceDocument),
    provenance: view.provenance(typedReference) === undefined
      ? null : immutableCopy(view.provenance(typedReference))
  });
}

function criterionExecutionLiteralContext_(plan, view, unit) {
  const selected = plan.selectedComprovante;
  criterionExecutionRequire_(selected && selected.kind === 'DOCUMENT' &&
    typeof selected.identifier === 'string' && selected.identifier,
  'literal ASSERT requires the authenticated selected comprovante');
  const selectedReference = new TypedReference(selected.kind, selected.identifier);
  criterionExecutionRequire_(view.contains(selectedReference),
    'selected comprovante does not belong to the execution view');
  const selectedDocumentTrace = criterionExecutionDocumentTrace_(
    view, selected, selected
  );
  const references = [selectedReference];
  const derivations = (plan.derivedDecisions || []).filter(item =>
    item && item.target === unit.appliesTo
  );
  criterionExecutionRequire_(derivations.length <= 1,
    'planned APPLIES_TO has ambiguous derived applicability trace');
  let applicabilityDerivation = null;
  if (derivations.length === 1) {
    const derived = derivations[0];
    criterionExecutionRequire_(derived.selectedDocument && derived.section &&
      derived.selectedDocument.reference && derived.section.reference &&
      derived.selectedDocument.reference.kind === 'DOCUMENT' &&
      derived.selectedDocument.reference.identifier === selected.identifier &&
      derived.section.reference.kind === 'DOCUMENT_SECTION' &&
      Array.isArray(derived.sourceDecisions) && derived.sourceDecisions.length > 0,
    'derived applicability trace is incomplete for literal ASSERT');
    const sectionReference = new TypedReference(
      derived.section.reference.kind, derived.section.reference.identifier
    );
    const sectionTrace = criterionExecutionDocumentTrace_(
      view, derived.section.reference, selected
    );
    references.push(sectionReference);
    const sourceDecisionTraces = derived.sourceDecisions.map(target => {
      const matches = (plan.officialDecisions || []).filter(item =>
        item && item.target === target
      );
      criterionExecutionRequire_(matches.length === 1,
        'derived applicability source decision must exist exactly once');
      const decision = matches[0];
      criterionExecutionRequire_(decision.selectedDocument && decision.section &&
        decision.selectedDocument.reference && decision.section.reference &&
        decision.selectedDocument.reference.kind === 'DOCUMENT' &&
        decision.selectedDocument.reference.identifier === selected.identifier,
      'derived applicability source decision has invalid source binding');
      const decisionSectionTrace = criterionExecutionDocumentTrace_(
        view, decision.section.reference, selected
      );
      references.push(new TypedReference(
        decision.section.reference.kind, decision.section.reference.identifier
      ));
      criterionExecutionRequire_(Array.isArray(decision.itemTraces),
        'derived applicability source item trace is invalid');
      const itemTraces = decision.itemTraces.map(trace => {
        criterionExecutionRequire_(trace && trace.reference,
          'derived applicability source item reference is missing');
        const itemTrace = criterionExecutionDocumentTrace_(view, trace.reference, selected);
        references.push(new TypedReference(trace.reference.kind, trace.reference.identifier));
        return itemTrace;
      });
      return immutableCopy({
        target: decision.target,
        decision: decision.decision,
        source: decision.source,
        rule: decision.rule,
        section: decisionSectionTrace,
        itemTraces
      });
    });
    applicabilityDerivation = immutableCopy({
      target: derived.target,
      decision: derived.decision,
      rule: derived.rule,
      sourceDecisions: derived.sourceDecisions,
      selectedDocument: selectedDocumentTrace,
      section: sectionTrace,
      sourceDecisionTraces
    });
  }
  const seen = new Set();
  const uniqueReferences = references.filter(reference => {
    const key = reference.kind + ':' + reference.identifier;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return Object.freeze({
    references: Object.freeze(uniqueReferences),
    binding: immutableCopy({
      type: 'LITERAL',
      value: EngineResult.MANUAL_REVIEW,
      selectedDocument: selectedDocumentTrace,
      applicabilityDerivation
    })
  });
}

function criterionExecutionRequireKeys_(value, expected, label) {
  criterionExecutionRequire_(value && typeof value === 'object' && !Array.isArray(value) &&
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify(expected.slice().sort()),
  label + ' has unsupported or residual fields');
}

function criterionExecutionMaterializeAssert_(contract, plan, view, unit, assertIr) {
  criterionExecutionRequire_(assertIr && typeof assertIr === 'object' &&
    !Array.isArray(assertIr), 'ASSERT IR node must be an object');
  if (assertIr.type === 'CALL') {
    criterionExecutionRequireKeys_(assertIr, ['type', 'name', 'arguments'], 'CALL');
    if (assertIr.name === 'TECHNICAL_PRODUCT_ATTRIBUTE') {
      criterionExecutionRequire_(Array.isArray(assertIr.arguments) && assertIr.arguments.length === 2,
        'TECHNICAL_PRODUCT_ATTRIBUTE must declare product and attribute symbols');
      const product = assertIr.arguments[0];
      const attribute = assertIr.arguments[1];
      criterionExecutionRequireKeys_(product, ['type', 'value'],
        'TECHNICAL_PRODUCT_ATTRIBUTE product argument');
      criterionExecutionRequireKeys_(attribute, ['type', 'value'],
        'TECHNICAL_PRODUCT_ATTRIBUTE attribute argument');
      criterionExecutionRequire_(product.type === 'SYMBOL' && attribute.type === 'SYMBOL',
        'TECHNICAL_PRODUCT_ATTRIBUTE arguments must be canonical symbols');
      return criterionExecutionBindTechnicalProductAttribute_(contract, view,
        product.value, attribute.value);
    }
    criterionExecutionRequire_(assertIr.name === 'EXISTS',
      'executor supports only the canonical EXISTS operator');
    criterionExecutionRequire_(Array.isArray(assertIr.arguments) && assertIr.arguments.length === 1,
      'EXISTS must declare exactly one argument');
    const argument = assertIr.arguments[0];
    criterionExecutionRequireKeys_(argument, ['type', 'value'], 'EXISTS argument');
    return criterionExecutionBindExists_(contract, view, argument);
  }
  if (assertIr.type === 'LITERAL') {
    criterionExecutionRequireKeys_(assertIr, ['type', 'value'], 'LITERAL');
    criterionExecutionRequire_(assertIr.value === 'MANUAL_REVIEW',
      'executor supports only the declared MANUAL_REVIEW literal');
    const context = criterionExecutionLiteralContext_(plan, view, unit);
    return Object.freeze({
      expression: new AssertLiteral(EngineResult.MANUAL_REVIEW, context.references),
      binding: context.binding
    });
  }
  if (assertIr.type === 'OR') {
    criterionExecutionRequireKeys_(assertIr, ['type', 'expressions'], 'OR');
    criterionExecutionRequire_(Array.isArray(assertIr.expressions) &&
      assertIr.expressions.length === 2, 'OR must declare exactly two expressions');
    const children = assertIr.expressions.map(child =>
      criterionExecutionMaterializeAssert_(contract, plan, view, unit, child));
    return Object.freeze({
      expression: new Or(children.map(child => child.expression)),
      binding: Object.freeze({ type: 'OR', expressions: Object.freeze(children.map(child => child.binding)) })
    });
  }
  throw new CriterionExecutionIntegrityError('ASSERT IR construct is unsupported');
}

function materializePlannedCriterion(contract, plan, unitKey, view) {
  criterionExecutionRequire_(typeof isImmutableExecutionView === 'function' &&
    isImmutableExecutionView(view), 'execution requires an ImmutableExecutionView');
  criterionExecutionRequire_(typeof isCanonicalCompiledRuntimeContract === 'function' &&
    isCanonicalCompiledRuntimeContract(contract),
  'canonical compiled runtime contract is required');
  const unit = criterionExecutionFindUnit_(plan, contract, view, unitKey);
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
  const validation = criterionExecutionTechnicalProductValidation_(
    contract, requirementMetadata, metadata, unit, view
  );
  if (validation === null) {
    criterionExecutionRequire_(Array.isArray(unit.validate) && unit.validate.length === 0 &&
      Array.isArray(unit.criterionValidate) && unit.criterionValidate.length === 0,
    'Phase 4 pilot does not execute VALIDATE functions');
  }
  if (metadata.appliesTo !== undefined) {
    criterionExecutionRequire_(Array.isArray(plan.PROCESS_SMSCI) &&
      plan.PROCESS_SMSCI.includes(metadata.appliesTo),
    'planned Criterion APPLIES_TO is not present in PROCESS.SMSCI');
  }
  const materialized = criterionExecutionMaterializeAssert_(
    contract, plan, view, unit, metadata.assertIr
  );
  if (validation !== null) {
    criterionExecutionRequireProductValidationAnchor_(
      metadata.assertIr, validation.binding.technicalProduct
    );
  }
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
      documentaryBinding: validation === null ? materialized.binding : immutableCopy({
        ...materialized.binding,
        validationBinding: validation.binding
      })
    }
  });
  return Object.freeze({ criterion, unit, metadata, binding: materialized.binding,
    validationExpression: validation === null ? null : validation.expression });
}

function executePlannedCriterion(contract, plan, unitKey, view) {
  const materialized = materializePlannedCriterion(contract, plan, unitKey, view);
  const registry = materialized.validationExpression === null
    ? new PredicateRegistry([])
    : new PredicateRegistry([technicalProductAttributePredicateContract()]);
  let result;
  if (materialized.validationExpression !== null) {
    const validationCriterion = new CriterionIR({
      criterionId: materialized.criterion.criterionId,
      requirementId: materialized.criterion.requirementId,
      expression: materialized.validationExpression,
      expectedResult: EngineResult.TRUE,
      traceability: materialized.criterion.traceability
    });
    const validationResult = evaluateCriterion(validationCriterion, registry, view);
    if (validationResult.engineResult === EngineResult.MANUAL_REVIEW) {
      result = validationResult;
    } else {
      criterionExecutionRequire_(validationResult.engineResult === EngineResult.TRUE,
        'TECHNICAL_PRODUCT_ATTRIBUTE VALIDATE returned an unsupported EngineResult');
      const assertResult = evaluateCriterion(materialized.criterion, registry, view);
      result = immutableCopy({ ...assertResult,
        trace: validationResult.trace.concat(assertResult.trace) });
    }
  } else {
    result = evaluateCriterion(materialized.criterion, registry, view);
  }
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
  return immutableCopy({
    unitKey: materialized.unit.unitKey,
    ...result
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CriterionExecutionIntegrityError,
    materializePlannedCriterion,
    executePlannedCriterion,
  };
}

Object.defineProperty(global, 'CriterionExecutionIntegrityError', {
  value: CriterionExecutionIntegrityError, enumerable: true, writable: false, configurable: false
});
Object.defineProperty(global, 'materializePlannedCriterion', {
  value: materializePlannedCriterion, enumerable: true, writable: false, configurable: false
});
Object.defineProperty(global, 'executePlannedCriterion', {
  value: executePlannedCriterion, enumerable: true, writable: false, configurable: false
});
})(globalThis);
