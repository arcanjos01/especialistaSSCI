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

const CRITERION_EXECUTION_TYPED_REFERENCE_CLASS_ = TypedReference;
const CRITERION_EXECUTION_ACTIVITY_PREDICATE_FACTORY_ =
  responsibilityDrtActivityExecutionPredicateContract;

function criterionExecutionRequire_(condition, message) {
  if (!condition) throw new CriterionExecutionIntegrityError(message);
}

function criterionExecutionStop_(message) {
  const error = new CriterionExecutionIntegrityError(message);
  error.code = 'EXECUTION_INTEGRITY_ERROR';
  throw error;
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

function criterionExecutionBindExists_(contract, plan, view, unit, argument) {
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
  const selected = criterionExecutionSelectedDocumentContext_(plan, view);
  return Object.freeze({
    expression: new AssertLiteral(EngineResult.MANUAL_REVIEW, [selected.reference]),
    binding: immutableCopy({
      type: 'EXISTS',
      entityId,
      matchedCount: 0,
      status: 'UNVERIFIED',
      reason: 'DOCUMENT_INVENTORY_UNAVAILABLE',
      selectedDocument: selected.document
    })
  });
}

function criterionExecutionBindTechnicalProductAttribute_(contract, plan, view, unit,
  technicalProduct, evidenceAttribute) {
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
  if (references.length === 0) {
    const selected = criterionExecutionSelectedDocumentContext_(plan, view);
    return Object.freeze({
      expression: new AssertLiteral(EngineResult.MANUAL_REVIEW, [selected.reference]),
      binding: immutableCopy({
        type: 'TECHNICAL_PRODUCT_ATTRIBUTE',
        technicalProduct,
        attribute: evidenceAttribute,
        matchedCount: 0,
        status: 'UNVERIFIED',
        reason: 'DOCUMENT_INVENTORY_UNAVAILABLE',
        selectedDocument: selected.document
      })
    });
  }
  const product = references[0];
  criterionExecutionRequire_(product instanceof TypedReference && view.contains(product) &&
    view.entityId(product) === technicalProduct,
  'technical product reference does not match its canonical entity');
  const sourceDocument = view.sourceDocument(product);
  criterionExecutionRequire_(sourceDocument instanceof TypedReference &&
    sourceDocument.kind === 'DOCUMENT',
  'technical product has an invalid source document');
  const productAttributes = view.read(product);
  criterionExecutionRequire_(productAttributes && typeof productAttributes === 'object' &&
    !Array.isArray(productAttributes),
  'technical product attributes are invalid');
  const signatureMechanismValue = productAttributes.SIGNATURE_MECHANISM;
  const hasSignatureMechanism = signatureMechanismValue !== undefined;
  const signatureMechanismText = hasSignatureMechanism
    ? signatureMechanismValue : null;
  criterionExecutionRequire_(!hasSignatureMechanism ||
    typeof signatureMechanismText === 'string',
  'technical product SIGNATURE_MECHANISM must remain literal text');
  const isIn08Tightness = unit.requirement &&
    unit.requirement.id === 'REQ_IN08_ESTANQUEIDADE' &&
    unit.criterion.id === 'T4_IN08_ESTANQUEIDADE';
  const isIn09TestReport = unit.requirement &&
    unit.requirement.id === 'REQ_IN09_TEST_REPORT' &&
    unit.criterion.id === 'T4_IN09_TEST_REPORT';
  let documentaryDateItems = null;
  if (isIn08Tightness) {
    criterionExecutionRequire_(product.kind === 'TEST_REPORT' &&
      typeof view.documentaryDateItems === 'function',
    'IN08 date disclosure requires the exact TEST_REPORT date collection');
    documentaryDateItems = view.documentaryDateItems(product);
    criterionExecutionRequire_(Array.isArray(documentaryDateItems),
      'IN08 date disclosure collection is invalid');
  }
  let documentaryTextExcerptItems = null;
  let documentaryTextExcerptCollectionState = null;
  if (isIn09TestReport) {
    criterionExecutionRequire_(product.kind === 'TEST_REPORT',
      'IN09 excerpt disclosure requires the exact TEST_REPORT reference');
    if (view.schemaVersion() === '0.8.0') {
      criterionExecutionRequire_(typeof view.documentaryTextExcerptItems === 'function',
        'IN09 excerpt collection is unavailable in the execution view');
      documentaryTextExcerptItems = view.documentaryTextExcerptItems(product);
      criterionExecutionRequire_(Array.isArray(documentaryTextExcerptItems),
        'IN09 excerpt collection is invalid');
      documentaryTextExcerptCollectionState = documentaryTextExcerptItems.length
        ? 'EXCERPTS_PRESERVED' : 'NO_EXCERPT_ITEMS_IN_COLLECTION';
    } else {
      documentaryTextExcerptItems = null;
      documentaryTextExcerptCollectionState = 'COLLECTION_UNAVAILABLE_IN_SCHEMA';
    }
  }
  const binding = {
    type: 'TECHNICAL_PRODUCT_ATTRIBUTE',
    technicalProduct,
    attribute: evidenceAttribute,
    matchedCount: references.length,
    sourceDocument: criterionExecutionReferenceSnapshot_(sourceDocument),
    provenance: view.provenance(product) === undefined ? null : view.provenance(product),
    signatureMechanismDisclosure: {
      state: hasSignatureMechanism ? 'LITERAL_PRESENT_IN_RDE' : 'NO_LITERAL_IN_RDE',
      literal: signatureMechanismText
    }
  };
  if (isIn08Tightness) binding.documentaryDateItems = documentaryDateItems;
  if (isIn09TestReport) {
    binding.documentaryTextExcerptDisclosure = {
      state: documentaryTextExcerptCollectionState,
      completeness: 'NOT_ASSERTED',
      items: documentaryTextExcerptItems
    };
  }
  return Object.freeze({
    expression: new PredicateCall('TECHNICAL_PRODUCT_ATTRIBUTE', {
      technicalProduct: product, attribute: evidenceAttribute
    }),
    binding: immutableCopy(binding)
  });
}

function criterionExecutionTechnicalProductValidation_(contract, requirementMetadata,
  metadata, unit, plan, view) {
  const validate = requirementMetadata.validate;
  if (!Array.isArray(validate) || validate.length === 0) return null;
  if (requirementMetadata.requirementId === 'REQ_T1_DRT_BASIC_DATA') {
    criterionExecutionRequire_(metadata.requirementId === 'REQ_T1_DRT_BASIC_DATA' &&
      ['T1_DRT_RI_LEGAL_ENTITY', 'T1_DRT_RT_NAME', 'T1_DRT_ADDRESS',
        'T1_DRT_AREA'].includes(metadata.criterionId) &&
      validate.length === 1 &&
      validate[0] === 'RESPONSIBILITY_EVIDENCE_MATCHES_PROCESS_RI_LEGAL_ENTITY' &&
      Array.isArray(unit.validate) && JSON.stringify(unit.validate) === JSON.stringify(validate) &&
      Array.isArray(unit.criterionValidate) && unit.criterionValidate.length === 0,
    'basic DRT data validation declaration is invalid');
    criterionExecutionRequire_(typeof view.referencesByEntity === 'function',
      'ImmutableExecutionView must expose typed DRT documents');
    const evidenceReferences = [];
    for (const entityId of ['ART', 'RRT', 'TRT']) {
      const references = view.referencesByEntity(entityId);
      criterionExecutionRequire_(Array.isArray(references),
        'ImmutableExecutionView returned an invalid DRT document collection');
      references.forEach(reference => evidenceReferences.push(reference));
    }
    return Object.freeze({
      expression: new PredicateCall('RESPONSIBILITY_DRT_ATTRIBUTE_DISCLOSURE', {
        evidenceReferences, attribute: 'RI_NAME'
      }),
      binding: immutableCopy({
        type: 'BASIC_DRT_RI_VALIDATION_DISCLOSURE',
        criterionId: metadata.criterionId,
        evidenceReferences
      })
    });
  }
  if (metadata.criterionId === 'T4_IN19_FINAL_VERIFICATION') {
    criterionExecutionRequire_(metadata.requirementId === 'REQ_IN19_FINAL_VERIFICATION' &&
      validate.length === 1 && validate[0] === 'RESPONSIBILITY_ACTIVITY_COMPATIBLE' &&
      Array.isArray(unit.validate) && JSON.stringify(unit.validate) === JSON.stringify(validate) &&
      Array.isArray(unit.criterionValidate) && unit.criterionValidate.length === 0,
    'RT-007 final-verification VALIDATE metadata is invalid');
    criterionExecutionRequire_(typeof resolvedRequiredTechnicalResponsibilities === 'function',
      'canonical responsibility domain resolver is required');
    const domain = resolvedRequiredTechnicalResponsibilities(contract, plan, view);
    const matches = domain.filter(item => item && item.catalogIdentifier === 'RT-007' &&
      item.requirementIds && item.requirementIds.includes('REQ_IN19_FINAL_VERIFICATION'));
    criterionExecutionRequire_(matches.length === 1 &&
      matches[0].responsibilityId === 'RT_007_AVALIACAO_TECNICA',
    'the frozen plan must resolve exactly the canonical RT-007 requirement mapping');
    const catalog = contract.responsibilityCatalog && contract.responsibilityCatalog['RT-007'];
    const literals = catalog && catalog.machineCompatibleActivityLiterals;
    criterionExecutionRequire_(Array.isArray(literals) && literals.length === 1 &&
      literals[0] === 'verificação final da instalação elétrica de baixa tensão',
    'RT-007 final-verification activity literal is invalid');
    criterionExecutionRequire_(typeof view.referencesByEntity === 'function',
      'ImmutableExecutionView must expose typed final-verification DRT facts');
    const evidenceReferences = view.referencesByEntity('LOW_VOLTAGE_FINAL_VERIFICATION_DRT');
    criterionExecutionRequire_(Array.isArray(evidenceReferences),
      'final-verification DRT references are invalid');
    return Object.freeze({
      expression: new PredicateCall('RESPONSIBILITY_DRT_ACTIVITY_FINAL_VERIFICATION', {
        evidenceReferences,
        expectedActivityLiterals: literals
      }),
      binding: immutableCopy({
        type: 'RT007_FINAL_VERIFICATION_ACTIVITY',
        responsibility: matches[0],
        evidenceReferences: evidenceReferences.map(criterionExecutionReferenceSnapshot_),
        expectedActivityLiterals: literals
      })
    });
  }
  if (metadata.criterionId === 'T1_DRT_ACTIVITY_EXECUTION') {
    criterionExecutionRequire_(validate.length === 1 &&
      validate[0] === 'RESPONSIBILITY_ACTIVITY_COMPATIBLE' &&
      Array.isArray(unit.validate) && JSON.stringify(unit.validate) === JSON.stringify(validate) &&
      Array.isArray(unit.criterionValidate) && unit.criterionValidate.length === 0,
    'RESPONSIBILITY_ACTIVITY_COMPATIBLE VALIDATE metadata is invalid');
    return criterionExecutionBindResponsibilityEvidence_(contract, plan, view,
      { type: 'SYMBOL', value: 'RT_002_EXECUCAO_DE_OBRA' }, metadata.criterionId);
  }
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
  return criterionExecutionBindTechnicalProductAttribute_(contract, plan, view, unit,
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

function criterionExecutionManualReviewProductGate_(assertIr, technicalProduct,
  requirementMetadata, metadata) {
  const allowed = {
    T4_IN07_COMMISSIONING: {
      requirementId: 'REQ_IN07_COMMISSIONING',
      product: 'SHP_COMMISSIONING_REPORT', smsci: 'SMSCI_SHP'
    },
    T4_IN08_ESTANQUEIDADE: {
      requirementId: 'REQ_IN08_ESTANQUEIDADE',
      product: 'GAS_TIGHTNESS_REPORT', smsci: 'SMSCI_GAS'
    },
    T4_IN09_TEST_REPORT: {
      requirementId: 'REQ_IN09_TEST_REPORT',
      product: 'PRESSURIZATION_TEST_REPORT', smsci: 'SMSCI_PRESSURIZATION'
    },
    T4_IN10_COMMISSIONING: {
      requirementId: 'REQ_IN10_COMMISSIONING',
      product: 'SMOKE_CONTROL_COMMISSIONING_REPORT', smsci: 'SMSCI_SMOKE_CONTROL_MECHANICAL'
    },
    T4_IN12_COMMISSIONING: {
      requirementId: 'REQ_IN12_COMMISSIONING',
      product: 'SDAI_COMMISSIONING_REPORT', smsci: 'SMSCI_SDAI'
    },
    T4_IN15_COMMISSIONING: {
      requirementId: 'REQ_IN15_COMMISSIONING',
      product: 'SPRINKLER_COMMISSIONING_REPORT', smsci: 'SMSCI_SPRINKLER'
    }
  };
  const spec = metadata && allowed[metadata.criterionId];
  return !!spec && metadata.requirementId === spec.requirementId &&
    requirementMetadata.requirementId === spec.requirementId &&
    metadata.appliesTo === spec.smsci && technicalProduct === spec.product &&
    requirementMetadata.technicalProduct === spec.product &&
    Array.isArray(requirementMetadata.evidenceAttributes) &&
    requirementMetadata.evidenceAttributes.length === 1 &&
    requirementMetadata.evidenceAttributes[0] === 'SIGNED' &&
    assertIr && assertIr.type === 'LITERAL' && assertIr.value === 'MANUAL_REVIEW' &&
    Object.keys(assertIr).sort().join(',') === 'type,value';
}

function criterionExecutionRequireProductValidationAnchor_(assertIr, technicalProduct,
  requirementMetadata, metadata) {
  const references = criterionExecutionProductReferences_(assertIr);
  criterionExecutionRequire_((references.length > 0 &&
    references.every(reference => reference === technicalProduct)) ||
    (references.length === 0 && criterionExecutionManualReviewProductGate_(assertIr,
      technicalProduct, requirementMetadata, metadata)),
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

function criterionExecutionSelectedDocumentContext_(plan, view) {
  const selected = plan.selectedComprovante;
  criterionExecutionRequire_(selected && selected.kind === 'DOCUMENT' &&
    typeof selected.identifier === 'string' && selected.identifier,
  'documentary review requires the authenticated selected comprovante');
  const selectedReference = new TypedReference(selected.kind, selected.identifier);
  criterionExecutionRequire_(view.contains(selectedReference),
    'selected comprovante does not belong to the execution view');
  const sourceDocument = view.sourceDocument(selectedReference);
  criterionExecutionRequire_(sourceDocument instanceof TypedReference &&
    sourceDocument.kind === 'DOCUMENT' && view.contains(sourceDocument),
  'selected comprovante has an invalid source document');
  return Object.freeze({
    reference: selectedReference,
    document: immutableCopy({
      reference: criterionExecutionReferenceSnapshot_(selectedReference),
      sourceDocument: criterionExecutionReferenceSnapshot_(sourceDocument),
      provenance: typeof view.provenance !== 'function' ||
        view.provenance(selectedReference) === undefined
        ? null : immutableCopy(view.provenance(selectedReference))
    })
  });
}

function criterionExecutionLiteralContext_(plan, view, unit) {
  const selectedContext = criterionExecutionSelectedDocumentContext_(plan, view);
  const selected = plan.selectedComprovante;
  const selectedReference = selectedContext.reference;
  const selectedDocumentTrace = selectedContext.document;
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

function criterionExecutionBindResponsibilityEvidence_(contract, plan, view, argument, criterionId) {
  criterionExecutionRequire_(argument && argument.type === 'SYMBOL' &&
    argument.value === 'RT_002_EXECUCAO_DE_OBRA',
  'RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE requires RT_002_EXECUCAO_DE_OBRA');
  criterionExecutionRequire_(typeof materializeResponsibilityEvidenceBinding === 'function' &&
    typeof isCanonicalResponsibilityEvidenceBinding === 'function',
  'canonical ResponsibilityEvidenceBinding support is required');
  const binding = materializeResponsibilityEvidenceBinding(contract, plan, view, 'RT-002');
  criterionExecutionRequire_(isCanonicalResponsibilityEvidenceBinding(binding, contract, plan, view),
    'canonical ResponsibilityEvidenceBinding is required');
  criterionExecutionRequire_(binding.responsibility &&
    binding.responsibility.catalogIdentifier === 'RT-002' &&
    binding.responsibility.documentaryResponsibilityType === 'EXECUCAO' &&
    Array.isArray(binding.evidence),
  'RT-002 ResponsibilityEvidenceBinding is invalid');
  const evidenceReferences = [];
  for (let index = 0; index < binding.evidence.length; index += 1) {
    const evidence = binding.evidence[index];
    criterionExecutionRequire_(evidence && evidence.reference &&
      evidence.reference.kind === 'DOCUMENT' && typeof evidence.reference.identifier === 'string' &&
      evidence.reference.identifier && evidence.selectionFact &&
      evidence.selectionFact.attribute === 'RESPONSIBILITY_TYPE' &&
      evidence.selectionFact.value === 'EXECUCAO',
    'RT-002 evidence must be selected by explicit RESPONSIBILITY_TYPE EXECUCAO');
    const reference = new CRITERION_EXECUTION_TYPED_REFERENCE_CLASS_(
      evidence.reference.kind, evidence.reference.identifier
    );
    criterionExecutionRequire_(view.contains(reference),
      'RT-002 evidence reference does not belong to the ImmutableExecutionView');
    evidenceReferences[evidenceReferences.length] = reference;
  }
  if (criterionId === 'T1_DRT_ACTIVITY_EXECUTION') {
    return Object.freeze({
      expression: new PredicateCall('RESPONSIBILITY_DRT_ACTIVITY_EXECUTION', {
        evidenceReferences,
        expectedActivityLiterals: binding.responsibility.machineCompatibleActivityLiterals
      }),
      binding: immutableCopy({ type: 'RESPONSIBILITY_DRT_ACTIVITY_EXECUTION',
        responsibility: binding.responsibility, evidence: binding.evidence })
    });
  }
  return Object.freeze({
    expression: new PredicateCall('RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE', {
      evidenceReferences
    }),
    binding: immutableCopy({
      type: 'RESPONSIBILITY_EVIDENCE',
      responsibility: binding.responsibility,
      evidence: binding.evidence
    })
  });
}

function criterionExecutionBindDrtAttributeDisclosure_(contract, plan, view, unit, argument) {
  criterionExecutionRequire_(argument && argument.type === 'SYMBOL' &&
    argument.value === 'REQUIRED_TECHNICAL_RESPONSIBILITY',
  'DRT attribute disclosure requires REQUIRED_TECHNICAL_RESPONSIBILITY');
  const basicAttributes = {
    T1_DRT_RI_LEGAL_ENTITY: 'RI_NAME',
    T1_DRT_RT_NAME: 'RT_NAME',
    T1_DRT_ADDRESS: 'PROPERTY_ADDRESS_TEXT',
    T1_DRT_AREA: 'PROPERTY_AREA_TEXT'
  };
  const registrationCriteria = ['T1_DRT_REGISTERED', 'T4_DRT_REGISTERED'];
  const signatureCriteria = ['T1_DRT_SIGNED', 'T4_DRT_SIGNED'];
  const isIn09Drt = unit.requirement && unit.requirement.id === 'REQ_IN09_DRT' &&
    unit.criterion.id === 'T4_IN09_DRT';
  const isBasicData = unit.requirement &&
    unit.requirement.id === 'REQ_T1_DRT_BASIC_DATA' &&
    Object.prototype.hasOwnProperty.call(basicAttributes, unit.criterion.id);
  const isRegistration = unit.requirement &&
    unit.requirement.id === 'REQ_T1_DRT_REGISTERED' &&
    registrationCriteria.includes(unit.criterion.id);
  const isSignature = unit.requirement &&
    unit.requirement.id === 'REQ_T1_DRT_SIGNED' &&
    signatureCriteria.includes(unit.criterion.id);
  criterionExecutionRequire_(isBasicData || isRegistration || isSignature || isIn09Drt,
    'DRT attribute disclosure is restricted to declared Criterion attributes');
  const attributes = isBasicData ? [basicAttributes[unit.criterion.id]] : isRegistration ? [
    'COUNCIL_REGISTRATION_STATUS', 'COUNCIL_ISSUANCE_STATUS', 'COUNCIL_PAYMENT_STATUS'
  ] : isSignature ? ['SIGNATURE_PARTY', 'SIGNATURE_MECHANISM'] : ['RESPONSIBILITY_TYPE'];
  const evidenceReferences = [];
  Object.keys(contract.entityCatalog).forEach(entityId => {
    const entity = contract.entityCatalog[entityId];
    if (!entity || entity.TYPE !== 'DOCUMENT' || entity.EXTENDS !== 'DRT' ||
        entity.ABSTRACT === true) return;
    const references = view.referencesByEntity(entityId);
    criterionExecutionRequire_(Array.isArray(references),
      'execution view returned an invalid DRT reference collection');
    references.forEach(reference => {
      criterionExecutionRequire_(reference instanceof TypedReference && view.contains(reference),
        'DRT disclosure reference does not belong to the ImmutableExecutionView');
      const source = view.sourceDocument(reference);
      criterionExecutionRequire_(source instanceof TypedReference &&
        source.kind === 'DOCUMENT' && source.identifier === reference.identifier,
      'DRT disclosure requires the exact DRT source document');
      evidenceReferences.push(reference);
    });
  });
  const expressions = attributes.map(attribute => new PredicateCall(
    'RESPONSIBILITY_DRT_ATTRIBUTE_DISCLOSURE', { evidenceReferences, attribute }
  ));
  return Object.freeze({
    expression: expressions.length === 1 ? expressions[0] : new All(expressions),
    binding: immutableCopy({
      type: 'DRT_ATTRIBUTE_DISCLOSURE',
      responsibility: argument.value,
      attributes,
      evidenceReferences
    })
  });
}

function criterionExecutionBindSmsciCoverage_(contract, plan, view, unit) {
  criterionExecutionRequire_(unit.criterion.id === 'T1_DRT_SMSCI_COVERAGE' &&
    unit.iterationSource === 'WORKLIST.SMSCI' && Array.isArray(unit.plannedBindings) &&
    unit.plannedBindings.length > 0,
  'RT-003 SMSCI coverage requires authenticated WORKLIST.SMSCI bindings');
  const binding = materializeResponsibilityEvidenceBinding(contract, plan, view, 'RT-003');
  criterionExecutionRequire_(isCanonicalResponsibilityEvidenceBinding(binding, contract, plan, view),
    'canonical RT-003 ResponsibilityEvidenceBinding is required');
  const literalList = binding.responsibility.machineCompatibleActivityLiterals;
  criterionExecutionRequire_(Array.isArray(literalList) && literalList.length === 1 &&
    literalList[0] === 'EXECUÇÃO dos SMSCI declarados.',
  'RT-003 activity literal contract is invalid');
  const evidenceReferences = [];
  for (let index = 0; index < binding.evidence.length; index += 1) {
    const evidence = binding.evidence[index];
    const reference = new CRITERION_EXECUTION_TYPED_REFERENCE_CLASS_(
      evidence.reference.kind, evidence.reference.identifier);
    criterionExecutionRequire_(view.contains(reference) && typeof view.drtScopeDeclarationItems === 'function',
      'RT-003 evidence reference is not a scope-capable DRT');
    evidenceReferences[evidenceReferences.length] = reference;
  }
  const expressions = unit.plannedBindings.map(planBinding => {
    const target = planBinding && planBinding.target;
    const entity = contract.entityCatalog && contract.entityCatalog[target];
    criterionExecutionRequire_(entity && entity.TYPE === 'SMSCI' &&
      typeof entity.OFFICIAL_ESCI_CODE === 'string' && entity.OFFICIAL_ESCI_CODE,
    'WORKLIST.SMSCI target lacks canonical OFFICIAL_ESCI_CODE');
    return new PredicateCall('RESPONSIBILITY_IS_SATISFIED_FOR_SMSCI', {
      evidenceReferences, expectedSmsciCode: entity.OFFICIAL_ESCI_CODE,
      expectedActivityLiteral: literalList[0]
    });
  });
  return Object.freeze({
    expression: new All(expressions),
    binding: immutableCopy({ type: 'RESPONSIBILITY_IS_SATISFIED_FOR_SMSCI',
      responsibility: binding.responsibility, evidence: binding.evidence, evidenceReferences,
      worklist: unit.plannedBindings })
  });
}

function criterionExecutionBindTechnicalProductRelation_(assertIr, contract, plan) {
  criterionExecutionRequire_(assertIr.name === 'RESPONSIBILITY_HAS_TECHNICAL_PRODUCT' &&
    Array.isArray(assertIr.arguments) && assertIr.arguments.length === 2,
  'RESPONSIBILITY_HAS_TECHNICAL_PRODUCT must declare responsibility and product');
  const responsibility = assertIr.arguments[0];
  const product = assertIr.arguments[1];
  criterionExecutionRequire_(responsibility.type === 'SYMBOL' && product.type === 'SYMBOL' &&
    responsibility.value === 'RT_002_EXECUCAO_DE_OBRA' && product.value === 'CONFORMITY_REPORT',
  'unsupported responsibility/product relation');
  return Object.freeze({
    expression: new PredicateCall('RESPONSIBILITY_HAS_TECHNICAL_PRODUCT', {
      responsibility: responsibility.value, technicalProduct: product.value
    }),
    binding: Object.freeze({ type: 'DRT_PRODUCT_CORRELATION', responsibility: responsibility.value,
      technicalProduct: product.value })
  });
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
      return criterionExecutionBindTechnicalProductAttribute_(contract, plan, view, unit,
        product.value, attribute.value);
    }
    if (assertIr.name === 'RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE') {
      criterionExecutionRequire_(Array.isArray(assertIr.arguments) && assertIr.arguments.length === 1,
        'RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE must declare exactly one argument');
      const argument = assertIr.arguments[0];
      criterionExecutionRequireKeys_(argument, ['type', 'value'],
        'RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE argument');
      return criterionExecutionBindResponsibilityEvidence_(contract, plan, view, argument,
        unit.criterion.id);
    }
    if (assertIr.name === 'RESPONSIBILITY_EVIDENCE_ATTRIBUTE') {
      criterionExecutionRequire_(Array.isArray(assertIr.arguments) &&
        assertIr.arguments.length === 2 &&
        assertIr.arguments[1] &&
        assertIr.arguments[1].type === 'SYMBOL' &&
        ((assertIr.arguments[1].value === 'REGISTERED' &&
          ['T1_DRT_REGISTERED', 'T4_DRT_REGISTERED'].includes(unit.criterion.id)) ||
         (assertIr.arguments[1].value === 'SIGNED' &&
          ['T1_DRT_SIGNED', 'T4_DRT_SIGNED'].includes(unit.criterion.id)) ||
         (assertIr.arguments[1].value === 'RESPONSIBILITY_TYPE' &&
          unit.requirement && unit.requirement.id === 'REQ_IN09_DRT' &&
          unit.criterion.id === 'T4_IN09_DRT')),
      'DRT status disclosure assertion is not declared for this Criterion');
      return criterionExecutionBindDrtAttributeDisclosure_(contract, plan, view, unit,
        assertIr.arguments[0]);
    }
    if (assertIr.name === 'RESPONSIBILITY_EVIDENCE_MATCHES_PROCESS_RI_LEGAL_ENTITY' ||
        assertIr.name === 'RESPONSIBILITY_RT_MATCHES_PRODUCT' ||
        assertIr.name === 'RESPONSIBILITY_EVIDENCE_MATCHES_PROCESS_ATTRIBUTE') {
      criterionExecutionRequire_(Array.isArray(assertIr.arguments) &&
        (assertIr.name === 'RESPONSIBILITY_EVIDENCE_MATCHES_PROCESS_ATTRIBUTE'
          ? assertIr.arguments.length === 2 : assertIr.arguments.length === 1),
      'DRT attribute disclosure arguments are malformed');
      return criterionExecutionBindDrtAttributeDisclosure_(contract, plan, view, unit,
        assertIr.arguments[0]);
    }
    if (assertIr.name === 'RESPONSIBILITY_IS_SATISFIED_FOR_SMSCI') {
      return criterionExecutionBindSmsciCoverage_(contract, plan, view, unit);
    }
    if (assertIr.name === 'RESPONSIBILITY_ACTIVITY_COMPATIBLE') {
      criterionExecutionRequire_(Array.isArray(assertIr.arguments) && assertIr.arguments.length === 1,
        'RESPONSIBILITY_ACTIVITY_COMPATIBLE must declare exactly one argument');
      const argument = assertIr.arguments[0];
      criterionExecutionRequireKeys_(argument, ['type', 'value'],
        'RESPONSIBILITY_ACTIVITY_COMPATIBLE argument');
      return criterionExecutionBindResponsibilityEvidence_(contract, plan, view, argument,
        unit.criterion.id);
    }
    if (assertIr.name === 'RESPONSIBILITY_HAS_TECHNICAL_PRODUCT') {
      criterionExecutionRequire_(unit.criterion && unit.criterion.id === 'T1_CONFORMITY_REPORT',
        'DRT/product relation is restricted to T1_CONFORMITY_REPORT');
      return criterionExecutionBindTechnicalProductRelation_(assertIr, contract, plan);
    }
    criterionExecutionRequire_(assertIr.name === 'EXISTS',
      'executor supports only the canonical EXISTS operator');
    criterionExecutionRequire_(Array.isArray(assertIr.arguments) && assertIr.arguments.length === 1,
      'EXISTS must declare exactly one argument');
    const argument = assertIr.arguments[0];
    criterionExecutionRequireKeys_(argument, ['type', 'value'], 'EXISTS argument');
    return criterionExecutionBindExists_(contract, plan, view, unit, argument);
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
  if (assertIr.type === 'ALL') {
    criterionExecutionRequireKeys_(assertIr, ['type', 'expressions'], 'ALL');
    criterionExecutionRequire_(Array.isArray(assertIr.expressions) &&
      assertIr.expressions.length > 0, 'ALL must declare at least one expression');
    const children = assertIr.expressions.map(child =>
      criterionExecutionMaterializeAssert_(contract, plan, view, unit, child));
    return Object.freeze({
      expression: new All(children.map(child => child.expression)),
      binding: Object.freeze({ type: 'ALL', expressions: Object.freeze(children.map(child => child.binding)) })
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
  criterionExecutionRequire_(unit.iterationSource === null ||
    (unit.iterationSource === 'WORKLIST.SMSCI' && unit.criterion.id === 'T1_DRT_SMSCI_COVERAGE'),
  'unsupported iterative Criterion');
  const validation = criterionExecutionTechnicalProductValidation_(
    contract, requirementMetadata, metadata, unit, plan, view
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
  if (validation !== null && validation.binding.type === 'TECHNICAL_PRODUCT_ATTRIBUTE') {
    criterionExecutionRequireProductValidationAnchor_(
      metadata.assertIr, validation.binding.technicalProduct, requirementMetadata, metadata
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

function criterionExecutionRequirePresentationBinding_(plan, view, context) {
  const planned = plan.selectedComprovante &&
    plan.selectedComprovante.kind === 'DOCUMENT' &&
    typeof plan.selectedComprovante.identifier === 'string'
    ? new CRITERION_EXECUTION_TYPED_REFERENCE_CLASS_(
      plan.selectedComprovante.kind, plan.selectedComprovante.identifier) : null;
  if (!planned || !view.contains(planned)) {
    criterionExecutionStop_('frozen plan has no presentation in its immutable execution view');
  }
  if (context === null || context === undefined) {
    criterionExecutionStop_('authenticated current submission context is required for Criterion execution');
  }
  if (typeof getAuthenticatedPresentationIdentity !== 'function' ||
      typeof selectCurrentComprovante !== 'function') {
    criterionExecutionStop_('authenticated presentation binding is unavailable');
  }
  let presentation;
  try {
    getAuthenticatedPresentationIdentity(context);
    presentation = selectCurrentComprovante(view, context);
  } catch (error) {
    criterionExecutionStop_('current submission context cannot authenticate this execution view');
  }
  if (!(presentation instanceof CRITERION_EXECUTION_TYPED_REFERENCE_CLASS_) ||
      presentation.kind !== planned.kind || presentation.identifier !== planned.identifier) {
    criterionExecutionStop_('current submission presentation differs from frozen execution plan');
  }
}

function executePlannedCriterion(contract, plan, unitKey, view, correlationProjection = null,
  currentSubmissionContext = null) {
  criterionExecutionRequire_(typeof isImmutableExecutionView === 'function' &&
    isImmutableExecutionView(view), 'execution requires an ImmutableExecutionView');
  criterionExecutionRequire_(typeof isCanonicalFrozenExecutionPlan === 'function' &&
    isCanonicalFrozenExecutionPlan(plan, contract, view),
  'canonical frozen execution plan is required for presentation binding');
  criterionExecutionRequirePresentationBinding_(plan, view, currentSubmissionContext);
  const materialized = materializePlannedCriterion(contract, plan, unitKey, view);
  const registry = new PredicateRegistry([
    responsibilityHasAcceptedDrtEvidencePredicateContract(),
    CRITERION_EXECUTION_ACTIVITY_PREDICATE_FACTORY_(),
    responsibilityDrtActivityFinalVerificationPredicateContract(),
    responsibilityIsSatisfiedForSmsciPredicateContract(),
    responsibilityHasTechnicalProductPredicateContract(),
    responsibilityDrtAttributeDisclosurePredicateContract(),
    ...(materialized.validationExpression === null ? [] : [technicalProductAttributePredicateContract()])
  ]);
  let result;
  if (materialized.validationExpression !== null) {
    const validationCriterion = new CriterionIR({
      criterionId: materialized.criterion.criterionId,
      requirementId: materialized.criterion.requirementId,
      expression: materialized.validationExpression,
      expectedResult: EngineResult.TRUE,
      traceability: materialized.criterion.traceability
    });
    const validationResult = evaluateCriterion_(validationCriterion, registry, view,
      correlationProjection, { contract, plan, unitKey, role: 'VALIDATE', currentSubmissionContext });
    if (validationResult.engineResult === EngineResult.MANUAL_REVIEW) {
      // Preserve useful, independent ASSERT evidence even when SIGNED cannot
      // be authenticated. The overall Criterion remains MANUAL_REVIEW; an
      // unresolved validation must never turn an ASSERT FALSE into FAIL/NC.
      const assertRepeatsSignatureValidation = materialized.metadata.assertIr.type === 'CALL' &&
        materialized.metadata.assertIr.name === 'TECHNICAL_PRODUCT_ATTRIBUTE';
      if (assertRepeatsSignatureValidation) {
        result = validationResult;
      } else {
        const assertResult = evaluateCriterion_(materialized.criterion, registry, view,
          correlationProjection, { contract, plan, unitKey, role: 'ASSERT', currentSubmissionContext });
        result = immutableCopy({ ...validationResult,
          trace: validationResult.trace.concat(assertResult.trace) });
      }
    } else {
      criterionExecutionRequire_(validationResult.engineResult === EngineResult.TRUE,
        'TECHNICAL_PRODUCT_ATTRIBUTE VALIDATE returned an unsupported EngineResult');
      const assertResult = evaluateCriterion_(materialized.criterion, registry, view,
        correlationProjection, { contract, plan, unitKey, role: 'ASSERT', currentSubmissionContext });
      result = immutableCopy({ ...assertResult,
        trace: validationResult.trace.concat(assertResult.trace) });
    }
  } else {
    result = evaluateCriterion_(materialized.criterion, registry, view,
      correlationProjection, { contract, plan, unitKey, role: 'ASSERT', currentSubmissionContext });
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
