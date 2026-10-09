(function (global) {
'use strict';
/** Frozen pre-Engine selection and planning; this module never evaluates a Criterion. */

class ExecutionIntegrityError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ExecutionIntegrityError';
    this.code = 'EXECUTION_INTEGRITY_ERROR';
  }
}

const PLAN_INTRINSIC_APPLY_ = Reflect.apply;
const PLAN_INTRINSIC_WEAKMAP_GET_ = WeakMap.prototype.get;
const PLAN_INTRINSIC_WEAKMAP_SET_ = WeakMap.prototype.set;
const PLAN_INTRINSIC_FREEZE_ = Object.freeze;
const PLAN_INTRINSIC_IS_FROZEN_ = Object.isFrozen;
const PLAN_INTRINSIC_ARRAY_IS_ARRAY_ = Array.isArray;
const PLAN_INTRINSIC_DEFINE_ = Object.defineProperty;
const PLAN_INTRINSIC_KEYS_ = Object.keys;
const PLAN_INTRINSIC_CREATE_ = Object.create;
const PLAN_INTRINSIC_HAS_OWN_ = Object.prototype.hasOwnProperty;
const PLAN_INTRINSIC_STRINGIFY_ = JSON.stringify;
const PLAN_INTRINSIC_MAP_ = Map;
const PLAN_INTRINSIC_MAP_GET_ = Map.prototype.get;
const PLAN_INTRINSIC_MAP_SET_ = Map.prototype.set;
const PLAN_INTRINSIC_MAP_HAS_ = Map.prototype.has;
const PLAN_INTRINSIC_MAP_FOR_EACH_ = Map.prototype.forEach;
const PLAN_INTRINSIC_MAP_SIZE_GET_ = Object.getOwnPropertyDescriptor(Map.prototype, 'size').get;
const PLAN_INTRINSIC_SET_ = Set;
const PLAN_INTRINSIC_SET_HAS_ = Set.prototype.has;
const PLAN_INTRINSIC_SET_ADD_ = Set.prototype.add;
const PLAN_INTRINSIC_SET_SIZE_GET_ = Object.getOwnPropertyDescriptor(Set.prototype, 'size').get;
const PLAN_INTRINSIC_ARRAY_FOR_EACH_ = Array.prototype.forEach;
const PLAN_INTRINSIC_ARRAY_FIND_ = Array.prototype.find;
const PLAN_INTRINSIC_ARRAY_INCLUDES_ = Array.prototype.includes;
const PLAN_INTRINSIC_ARRAY_SORT_ = Array.prototype.sort;
const PLAN_INTRINSIC_ARRAY_INDEX_OF_ = Array.prototype.indexOf;
const PLAN_INTRINSIC_ARRAY_JOIN_ = Array.prototype.join;
const PLAN_IS_CANONICAL_CONTRACT_ = isCanonicalCompiledRuntimeContract;
const PLAN_IS_CANONICAL_RESOLUTION_ = isCanonicalCbmscApplicabilityResolution;
const PLAN_TYPED_REFERENCE_ = TypedReference;

function planApply_(intrinsic, receiver, args) {
  return PLAN_INTRINSIC_APPLY_(intrinsic, receiver, args);
}
function planForEach_(array, callback) {
  return planApply_(PLAN_INTRINSIC_ARRAY_FOR_EACH_, array, [callback]);
}
function planSetIndex_(array, index, value) {
  PLAN_INTRINSIC_DEFINE_(array, index, {
    value, enumerable: true, writable: true, configurable: true,
  });
}
function planMap_(array, callback) {
  const result = [];
  result.length = array.length;
  for (let index = 0; index < array.length; index += 1) {
    if (!planHasOwn_(array, index)) continue;
    planSetIndex_(result, index, callback(array[index], index, array));
  }
  return result;
}
function planFilter_(array, callback) {
  const result = [];
  for (let index = 0; index < array.length; index += 1) {
    if (planHasOwn_(array, index) && callback(array[index], index, array)) {
      planSetIndex_(result, result.length, array[index]);
    }
  }
  return result;
}
function planFind_(array, callback) {
  return planApply_(PLAN_INTRINSIC_ARRAY_FIND_, array, [callback]);
}
function planSlice_(array) {
  return planMap_(array, value => value);
}
function planConcat_(array, other) {
  const result = planSlice_(array);
  for (let index = 0; index < other.length; index += 1) {
    if (planHasOwn_(other, index)) planSetIndex_(result, result.length, other[index]);
    else result.length += 1;
  }
  return result;
}
function planIncludes_(array, value) {
  return planApply_(PLAN_INTRINSIC_ARRAY_INCLUDES_, array, [value]);
}
function planPush_(array, value) {
  const nextIndex = array.length;
  planSetIndex_(array, nextIndex, value);
  return nextIndex + 1;
}
function planSort_(array) {
  return planApply_(PLAN_INTRINSIC_ARRAY_SORT_, array, []);
}
function planIndexOf_(array, value) {
  return planApply_(PLAN_INTRINSIC_ARRAY_INDEX_OF_, array, [value]);
}
function planHasOwn_(value, key) {
  return planApply_(PLAN_INTRINSIC_HAS_OWN_, value, [key]);
}
function planMapGet_(map, key) { return planApply_(PLAN_INTRINSIC_MAP_GET_, map, [key]); }
function planMapSet_(map, key, value) { return planApply_(PLAN_INTRINSIC_MAP_SET_, map, [key, value]); }
function planMapHas_(map, key) { return planApply_(PLAN_INTRINSIC_MAP_HAS_, map, [key]); }
function planMapValues_(map) {
  const values = [];
  planApply_(PLAN_INTRINSIC_MAP_FOR_EACH_, map, [value => planPush_(values, value)]);
  return values;
}
function planSetHas_(set, value) { return planApply_(PLAN_INTRINSIC_SET_HAS_, set, [value]); }
function planSetAdd_(set, value) { return planApply_(PLAN_INTRINSIC_SET_ADD_, set, [value]); }
function planMapSize_(map) { return planApply_(PLAN_INTRINSIC_MAP_SIZE_GET_, map, []); }
function planSetSize_(set) { return planApply_(PLAN_INTRINSIC_SET_SIZE_GET_, set, []); }
function planJoin_(array, separator) { return planApply_(PLAN_INTRINSIC_ARRAY_JOIN_, array, [separator]); }
function planSetFromArray_(array) {
  const result = new PLAN_INTRINSIC_SET_();
  for (let index = 0; index < array.length; index += 1) planSetAdd_(result, array[index]);
  return result;
}
function planMapFromPairs_(pairs) {
  const result = new PLAN_INTRINSIC_MAP_();
  for (let index = 0; index < pairs.length; index += 1) {
    planMapSet_(result, pairs[index][0], pairs[index][1]);
  }
  return result;
}

function planFreeze_(value, seen) {
  if (!value || typeof value !== 'object' || PLAN_INTRINSIC_IS_FROZEN_(value)) return value;
  const active = seen || [];
  if (planIndexOf_(active, value) >= 0) throw new ExecutionIntegrityError('cyclic execution plan');
  const next = planConcat_(active, [value]);
  planForEach_(PLAN_INTRINSIC_KEYS_(value), key => planFreeze_(value[key], next));
  return PLAN_INTRINSIC_FREEZE_(value);
}

function planClone_(value, active) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof PLAN_TYPED_REFERENCE_) return { kind: value.kind, identifier: value.identifier };
  const ancestors = active || [];
  if (planIndexOf_(ancestors, value) >= 0) throw new ExecutionIntegrityError('cyclic input in execution plan');
  const next = planConcat_(ancestors, [value]);
  if (PLAN_INTRINSIC_ARRAY_IS_ARRAY_(value)) return planMap_(value, item => planClone_(item, next));
  const copy = PLAN_INTRINSIC_CREATE_(null);
  planForEach_(planSort_(PLAN_INTRINSIC_KEYS_(value)), key => {
    copy[key] = planClone_(value[key], next);
  });
  return copy;
}

function planRequire_(condition, message) {
  if (!condition) throw new ExecutionIntegrityError(message);
}

function planIndexes_(contract) {
  planRequire_(contract && contract.contractVersion === 1, 'compiled contract version is invalid');
  const requirementById = new PLAN_INTRINSIC_MAP_();
  planForEach_(contract.requirements || [], item => {
    planRequire_(item && typeof item.requirementId === 'string' &&
      !planMapHas_(requirementById, item.requirementId), 'duplicate or invalid Requirement metadata');
    planMapSet_(requirementById, item.requirementId, item);
    planRequire_(planIncludes_(['1', '4'], item.table),
      'Requirement TABLE is invalid: ' + item.requirementId);
    if (item.smsci !== undefined) {
      const target = contract.entityCatalog && contract.entityCatalog[item.smsci];
      planRequire_(target && target.TYPE === 'SMSCI' && target.APPLICABILITY_TARGET_CLASS,
        'Requirement SMSCI metadata is unresolved: ' + item.requirementId);
    }
    if (item.in19DocumentationRegime !== undefined) {
      planRequire_(planIncludes_(['CURRENT', 'LEGACY', 'UNRESOLVED'], item.in19DocumentationRegime),
        'Requirement IN19 regime metadata is invalid: ' + item.requirementId);
    }
  });
  const criterionById = new PLAN_INTRINSIC_MAP_();
  planForEach_(contract.criteria || [], item => {
    planRequire_(item && typeof item.criterionId === 'string' &&
      !planMapHas_(criterionById, item.criterionId), 'duplicate or invalid Criterion metadata');
    planMapSet_(criterionById, item.criterionId, item);
    planRequire_(planIncludes_(['1', '4'], item.table),
      'Criterion TABLE is invalid: ' + item.criterionId);
    if (item.appliesTo !== undefined) {
      const target = contract.entityCatalog && contract.entityCatalog[item.appliesTo];
      planRequire_(target && target.TYPE === 'SMSCI' && target.APPLICABILITY_TARGET_CLASS,
        'Criterion APPLIES_TO metadata is unresolved: ' + item.criterionId);
    }
  });
  const nonconformities = contract.nonconformities || {};
  const indexByRequirement = new PLAN_INTRINSIC_MAP_();
  planForEach_(contract.compiledExecutionIndex || [], block => {
    planRequire_(block && planMapHas_(requirementById, block.requirementId) &&
      !planMapHas_(indexByRequirement, block.requirementId), 'invalid or duplicate compiled Requirement block');
    planMapSet_(indexByRequirement, block.requirementId, block);
  });
  planRequire_(planMapSize_(requirementById) === planMapSize_(indexByRequirement),
    'compiled index has missing or extra Requirement blocks');
  planRequire_(canonicalPlanJson_(planMap_(planMapValues_(indexByRequirement), block => block.requirementId)) ===
    canonicalPlanJson_(planMap_(planMapValues_(requirementById), item => item.requirementId)),
  'compiled Requirement order differs from canonical metadata');
  const indexedCriteria = new PLAN_INTRINSIC_SET_();
  const indexedRequirements = planMapValues_(requirementById);
  for (let requirementIndex = 0; requirementIndex < indexedRequirements.length; requirementIndex += 1) {
    const requirement = indexedRequirements[requirementIndex];
    const indexBlock = planMapGet_(indexByRequirement, requirement.requirementId);
    planRequire_(indexBlock, 'compiled index missing Requirement: ' + requirement.requirementId);
    const requirementNCs = requirement.nonconformities || [];
    for (let ncIndex = 0; ncIndex < requirementNCs.length; ncIndex += 1) {
      const ncId = requirementNCs[ncIndex];
      planRequire_(planHasOwn_(nonconformities, ncId) &&
        nonconformities[ncId].REF_REQUIREMENT === requirement.requirementId,
      'invalid Requirement Nonconformity reference: ' + ncId);
    }
    const seenKeys = new PLAN_INTRINSIC_SET_();
    planForEach_(indexBlock.units || [], unit => {
      planRequire_(unit && typeof unit.unitKey === 'string' && !planSetHas_(seenKeys, unit.unitKey),
        'duplicate or invalid UNIT_KEY in compiled index');
      planSetAdd_(seenKeys, unit.unitKey);
      const criterion = planMapGet_(criterionById, unit.criterionId);
      planRequire_(unit.requirementId === requirement.requirementId && criterion &&
        criterion.requirementId === requirement.requirementId &&
        unit.unitKey === 'UNIT_KEY (' + requirement.requirementId + ', ' + criterion.criterionId + ')',
      'Criterion association mismatch for UNIT_KEY: ' + unit.unitKey);
      if (criterion.appliesTo !== undefined) {
        planRequire_(requirement.smsci === criterion.appliesTo,
          'Criterion APPLIES_TO differs from associated Requirement SMSCI: ' + criterion.criterionId);
      }
      planRequire_(!planSetHas_(indexedCriteria, criterion.criterionId),
        'Criterion appears more than once in compiled index: ' + criterion.criterionId);
      planSetAdd_(indexedCriteria, criterion.criterionId);
      planRequire_(criterion.forEach === (requirement.forEach || null),
        'Criterion FOR_EACH differs from Requirement: ' + criterion.criterionId);
      const criterionNCs = criterion.failNonconformities || [];
      for (let ncIndex = 0; ncIndex < criterionNCs.length; ncIndex += 1) {
        const ncId = criterionNCs[ncIndex];
        const nc = nonconformities[ncId];
        planRequire_(nc && nc.REF_REQUIREMENT === requirement.requirementId &&
          nc.REF_CRITERION === criterion.criterionId && nc.TABLE === criterion.table,
        'invalid Criterion Nonconformity reference: ' + ncId);
      }
    });
  }
  planRequire_(planSetSize_(indexedCriteria) === planMapSize_(criterionById),
    'compiled index has missing or extra Criterion metadata');
  const criteria = planMapValues_(criterionById);
  for (let index = 0; index < criteria.length; index += 1) {
    const criterion = criteria[index];
    planRequire_(planMapHas_(requirementById, criterion.requirementId),
      'Criterion references missing Requirement: ' + criterion.criterionId);
  }
  const nonconformityIds = PLAN_INTRINSIC_KEYS_(nonconformities);
  for (let index = 0; index < nonconformityIds.length; index += 1) {
    const ncId = nonconformityIds[index];
    const nc = nonconformities[ncId];
    planRequire_(planMapHas_(requirementById, nc.REF_REQUIREMENT) &&
      planMapHas_(criterionById, nc.REF_CRITERION) &&
      planMapGet_(criterionById, nc.REF_CRITERION).requirementId === nc.REF_REQUIREMENT &&
      nc.TABLE === planMapGet_(criterionById, nc.REF_CRITERION).table,
    'Nonconformity reference is unresolved: ' + ncId);
  }
  return { requirementById, criterionById, indexByRequirement };
}

function applicableRequirements_(contract, resolution, indexes) {
  planRequire_(resolution && PLAN_INTRINSIC_ARRAY_IS_ARRAY_(resolution.PROCESS_SMSCI),
    'applicability resolution has no complete PROCESS.SMSCI');
  const officialTargets = contract.officialEsciTargets || [];
  planRequire_(officialTargets.length === 28 &&
    (resolution.officialDecisions || []).length === 28,
    'applicability resolution is not complete for all official targets');
  const decisions = resolution.officialDecisions;
  const officialTargetsInOrder = planMap_(officialTargets, item => item.entityId);
  planRequire_(planSetSize_(planSetFromArray_(officialTargetsInOrder)) === 28 &&
    canonicalPlanJson_(planMap_(decisions, item => item.target)) === canonicalPlanJson_(officialTargetsInOrder),
  'official decisions have missing, extra, duplicate or reordered targets');
  const positiveOfficial = [];
  planForEach_(decisions, (decision, index) => {
    const target = officialTargets[index];
    const documentRef = decision.selectedDocument && decision.selectedDocument.reference;
    const sectionRef = decision.section && decision.section.reference;
    planRequire_(planIncludes_(['POSITIVE', 'NEGATIVE'], decision.decision) &&
      decision.code === target.code && documentRef && documentRef.kind === 'DOCUMENT' &&
      sectionRef && sectionRef.kind === 'DOCUMENT_SECTION' &&
      decision.rule && decision.source === 'OFFICIAL_ESCI_CODE' &&
      PLAN_INTRINSIC_ARRAY_IS_ARRAY_(decision.itemReferences) && PLAN_INTRINSIC_ARRAY_IS_ARRAY_(decision.itemTraces),
    'official decision trace is incomplete: ' + target.entityId);
    planRequire_(decision.itemReferences.length === decision.itemTraces.length &&
      (decision.decision !== 'POSITIVE' || decision.itemReferences.length > 0) &&
      (decision.decision !== 'NEGATIVE' || decision.itemReferences.length === 0),
    'official decision evidence trace disagrees with its decision: ' + target.entityId);
    planForEach_(decision.itemTraces, (trace, traceIndex) => {
      const itemReference = decision.itemReferences[traceIndex];
      planRequire_(trace && itemReference && itemReference.kind === 'DOCUMENTARY_EVIDENCE' &&
      typeof itemReference.identifier === 'string' && trace.reference &&
      trace.reference.kind === 'DOCUMENTARY_EVIDENCE' &&
      trace.reference.identifier === itemReference.identifier &&
      trace.sourceDocument && trace.sourceDocument.kind === 'DOCUMENT' &&
      trace.sourceDocument.identifier === documentRef.identifier,
      'official decision item trace is incomplete: ' + target.entityId);
    });
    if (decision.decision === 'POSITIVE') planPush_(positiveOfficial, target.entityId);
  });
  const derived = resolution.derivedDecisions || [];
  const expectedDerivedTargets = ['SMSCI_SDAI', 'SMSCI_IN19_APPLICABILITY_REVIEW'];
  planRequire_(canonicalPlanJson_(planMap_(derived, item => item.target)) ===
    canonicalPlanJson_(expectedDerivedTargets), 'derived applicability decisions are incomplete');
  planForEach_(derived, item => planRequire_(
    planIncludes_(['POSITIVE', 'NEGATIVE'], item.decision) && item.rule &&
      PLAN_INTRINSIC_ARRAY_IS_ARRAY_(item.sourceDecisions) && item.selectedDocument && item.section,
    'derived applicability trace is incomplete: ' + item.target
  ));
  let sharedDocumentAndSection = !!resolution.selectedComprovante &&
    resolution.selectedComprovante.kind === 'DOCUMENT';
  const firstSectionId = resolution.officialDecisions[0].section.reference.identifier;
  for (let index = 0; index < resolution.officialDecisions.length; index += 1) {
    const item = resolution.officialDecisions[index];
    if (item.selectedDocument.reference.identifier !== resolution.selectedComprovante.identifier ||
        item.section.reference.identifier !== firstSectionId) sharedDocumentAndSection = false;
  }
  planRequire_(sharedDocumentAndSection,
    'applicability decisions do not share one selected document and section');
  const contextProvenance = resolution.currentSubmissionProvenance;
  planRequire_(contextProvenance && typeof contextProvenance.sourceKind === 'string' &&
    contextProvenance.sourceKind.length > 0 && typeof contextProvenance.sourceReference === 'string' &&
    contextProvenance.sourceReference.length > 0,
  'current submission operational provenance is incomplete');
  const decisionByTarget = planMapFromPairs_(planMap_(decisions, item => [item.target, item]));
  const derivedByTarget = planMapFromPairs_(planMap_(derived, item => [item.target, item]));
  const expectedSdai = planMapGet_(decisionByTarget, 'SMSCI_AI').decision === 'POSITIVE' ||
    planMapGet_(decisionByTarget, 'SMSCI_DAI').decision === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE';
  const expectedReview = planMapGet_(decisionByTarget, 'SMSCI_IEL').decision === 'POSITIVE'
    ? 'NEGATIVE' : 'POSITIVE';
  planRequire_(planMapGet_(derivedByTarget, 'SMSCI_SDAI').decision === expectedSdai &&
    canonicalPlanJson_(planMapGet_(derivedByTarget, 'SMSCI_SDAI').sourceDecisions) ===
      canonicalPlanJson_(['SMSCI_AI', 'SMSCI_DAI']),
  'SMSCI_SDAI derivation is inconsistent with AI/DAI decisions');
  planRequire_(planMapGet_(derivedByTarget, 'SMSCI_IN19_APPLICABILITY_REVIEW').decision === expectedReview &&
    canonicalPlanJson_(planMapGet_(derivedByTarget, 'SMSCI_IN19_APPLICABILITY_REVIEW').sourceDecisions) ===
      canonicalPlanJson_(['SMSCI_IEL']),
  'IN19 applicability-review derivation is inconsistent with IEL decision');
  const processTargets = resolution.PROCESS_SMSCI;
  const processSet = planSetFromArray_(processTargets);
  planRequire_(planSetSize_(processSet) === processTargets.length, 'PROCESS.SMSCI contains duplicate targets');
  const expectedProcess = planConcat_(positiveOfficial,
    planMap_(planFilter_(derived, item => item.decision === 'POSITIVE'), item => item.target)
  );
  planRequire_(canonicalPlanJson_(processTargets) === canonicalPlanJson_(expectedProcess),
    'PROCESS.SMSCI does not equal the complete positive official and derived scopes');
  const regime = resolution.IN19_DOCUMENTATION_REGIME;
  const ielPositive = planFind_(decisions, item => item.target === 'SMSCI_IEL').decision === 'POSITIVE';
  if (ielPositive) {
    planRequire_(planIncludes_(['CURRENT', 'LEGACY'], regime), 'positive SMSCI_IEL requires CURRENT or LEGACY');
    planRequire_(resolution.IN19_DOCUMENTATION_REGIME_TRACE &&
      resolution.IN19_DOCUMENTATION_REGIME_TRACE.source === 'REQUEST_DATE' &&
      resolution.IN19_DOCUMENTATION_REGIME_TRACE.decision === regime &&
      resolution.IN19_DOCUMENTATION_REGIME_TRACE.selectedDocument &&
      resolution.IN19_DOCUMENTATION_REGIME_TRACE.selectedDocument.reference.identifier ===
        resolution.selectedComprovante.identifier,
    'IN19 documentation regime trace is incomplete or inconsistent');
  } else {
    planRequire_(regime === undefined && resolution.IN19_DOCUMENTATION_REGIME_TRACE === undefined,
      'negative SMSCI_IEL must not resolve an IN19 regime');
  }
  const result = [];
  for (let index = 0; index < contract.requirements.length; index += 1) {
    const source = contract.requirements[index];
    if (source.smsci && !planSetHas_(processSet, source.smsci)) continue;
    if (source.in19DocumentationRegime !== undefined &&
        source.in19DocumentationRegime !== regime) continue;
    planRequire_(planMapHas_(indexes.requirementById, source.requirementId),
      'applicable Requirement is absent from compiled contract');
    planPush_(result, source);
  }
  return result;
}

function worklistSmsci_(contract, resolution) {
  const positive = planSetFromArray_(resolution.PROCESS_SMSCI);
  return planMap_(planFilter_(contract.officialEsciTargets,
    target => planSetHas_(positive, target.entityId)), target => target.entityId);
}

function expectedPlannedUnits_(contract, resolution, applicable, worklist, indexes) {
  const processSet = planSetFromArray_(resolution.PROCESS_SMSCI);
  const units = [];
  const expectedKeys = [];
  for (let requirementIndex = 0; requirementIndex < applicable.length; requirementIndex += 1) {
    const requirement = applicable[requirementIndex];
    const block = planMapGet_(indexes.indexByRequirement, requirement.requirementId);
    planRequire_(block && PLAN_INTRINSIC_ARRAY_IS_ARRAY_(block.units) && block.units.length,
      'compiled index block is empty or missing: ' + requirement.requirementId);
    planRequire_(block.iterationSource === (requirement.forEach || null),
      'ITERATION_SOURCE differs from Requirement FOR_EACH: ' + requirement.requirementId);
    for (let unitIndex = 0; unitIndex < block.units.length; unitIndex += 1) {
      const indexUnit = block.units[unitIndex];
      const criterion = planMapGet_(indexes.criterionById, indexUnit.criterionId);
      planRequire_(criterion && criterion.requirementId === requirement.requirementId,
        'Criterion association mismatch: ' + indexUnit.unitKey);
      planRequire_(criterion.table === '1' || criterion.table === '4',
        'Criterion TABLE is incompatible: ' + criterion.criterionId);
      if (criterion.appliesTo !== undefined) {
        planRequire_(requirement.smsci === criterion.appliesTo,
          'APPLIES_TO differs from associated Requirement SMSCI: ' + criterion.criterionId);
        planRequire_(planSetHas_(processSet, criterion.appliesTo),
          'APPLIES_TO is inconsistent with PROCESS.SMSCI: ' + criterion.criterionId);
      }
      const unitRequirementNCs = requirement.nonconformities || [];
      const criterionNCs = criterion.failNonconformities || [];
      const allNCs = planConcat_(unitRequirementNCs, criterionNCs);
      for (let ncIndex = 0; ncIndex < allNCs.length; ncIndex += 1) {
        const ncId = allNCs[ncIndex];
        planRequire_(planHasOwn_(contract.nonconformities, ncId),
          'Nonconformity reference is absent: ' + ncId);
      }
      let iterationDomain = null;
      if (block.iterationSource !== null) {
        planRequire_(block.iterationSource === 'WORKLIST.SMSCI',
          'unknown ITERATION_SOURCE: ' + block.iterationSource);
        iterationDomain = planSlice_(worklist);
      }
      planPush_(expectedKeys, indexUnit.unitKey);
      planPush_(units, {
        unitKey: indexUnit.unitKey,
        requirement: { id: requirement.requirementId },
        criterion: { id: criterion.criterionId },
        requirementTable: requirement.table,
        criterionTable: criterion.table,
        context: criterion.context === undefined ? null : criterion.context,
        validate: planSlice_(requirement.validate || []),
        criterionValidate: planSlice_(criterion.validate || []),
        appliesTo: criterion.appliesTo === undefined ? null : criterion.appliesTo,
        iterationSource: block.iterationSource,
        iterationDomain,
        plannedBindings: iterationDomain === null ? [] : planMap_(iterationDomain, target => ({ target })),
        nonconformityReferences: {
          requirement: planSlice_(unitRequirementNCs),
          criterionFail: planSlice_(criterionNCs),
        },
      });
    }
  }
  if (planSetSize_(planSetFromArray_(expectedKeys)) !== expectedKeys.length) {
    throw new ExecutionIntegrityError('UNIT_KEY duplicated across applicable Requirements');
  }
  return { units, expectedKeys };
}

function canonicalPlanJson_(value) {
  if (PLAN_INTRINSIC_ARRAY_IS_ARRAY_(value)) return '[' + planJoin_(planMap_(value, canonicalPlanJson_), ',') + ']';
  if (value && typeof value === 'object') {
    return '{' + planJoin_(planMap_(planSort_(PLAN_INTRINSIC_KEYS_(value)), key =>
      PLAN_INTRINSIC_STRINGIFY_(key) + ':' + canonicalPlanJson_(value[key])
    ), ',') + '}';
  }
  return PLAN_INTRINSIC_STRINGIFY_(value);
}

/** Public integrity gate also used to reject missing, extra, duplicate or altered units. */
function validateExecutionPlanIntegrity(contract, resolution, applicableIds, worklist, plannedUnits) {
  const indexes = planIndexes_(contract);
  planRequire_(PLAN_INTRINSIC_ARRAY_IS_ARRAY_(applicableIds) &&
    PLAN_INTRINSIC_ARRAY_IS_ARRAY_(worklist) && PLAN_INTRINSIC_ARRAY_IS_ARRAY_(plannedUnits),
    'plan integrity inputs must be arrays');
  const applicable = planMap_(applicableIds, id => {
    const requirement = planMapGet_(indexes.requirementById, id);
    planRequire_(requirement, 'Requirement does not exist: ' + id);
    return requirement;
  });
  const expectedApplicable = planMap_(applicableRequirements_(contract, resolution, indexes),
    item => item.requirementId);
  planRequire_(canonicalPlanJson_(applicableIds) === canonicalPlanJson_(expectedApplicable),
    'APPLICABLE_REQUIREMENTS is missing, extra or out of canonical order');
  const expectedWorklist = worklistSmsci_(contract, resolution);
  planRequire_(canonicalPlanJson_(worklist) === canonicalPlanJson_(expectedWorklist),
    'WORKLIST.SMSCI is missing, extra or out of canonical order');
  const expected = expectedPlannedUnits_(contract, resolution, applicable, worklist, indexes);
  const actualKeys = planMap_(plannedUnits, unit => unit && unit.unitKey);
  planRequire_(planSetSize_(planSetFromArray_(actualKeys)) === actualKeys.length,
    'PLANNED_EXECUTION_UNITS contains duplicate UNIT_KEY');
  planRequire_(canonicalPlanJson_(actualKeys) === canonicalPlanJson_(expected.expectedKeys),
    'PLANNED_EXECUTION_UNITS contains missing, extra or reordered UNIT_KEY');
  planRequire_(canonicalPlanJson_(plannedUnits) === canonicalPlanJson_(expected.units),
    'PLANNED_EXECUTION_UNITS metadata differs from compiled contract');
  return true;
}

/** Resolves applicability metadata and freezes the plan; no Criterion is evaluated. */
function materializeFrozenExecutionPlanInternal_(contract, resolution) {
  const indexes = planIndexes_(contract);
  const applicable = applicableRequirements_(contract, resolution, indexes);
  const applicableIds = planMap_(applicable, item => item.requirementId);
  const worklist = worklistSmsci_(contract, resolution);
  const materialized = expectedPlannedUnits_(contract, resolution, applicable, worklist, indexes);
  validateExecutionPlanIntegrity(
    contract, resolution, applicableIds, worklist, materialized.units
  );
  const plan = {
    selectedComprovante: planClone_(resolution.selectedComprovante),
    officialDecisions: planClone_(resolution.officialDecisions),
    derivedDecisions: planClone_(resolution.derivedDecisions),
    PROCESS_SMSCI: planSlice_(resolution.PROCESS_SMSCI),
    ...(resolution.IN19_DOCUMENTATION_REGIME === undefined ? {} : {
      IN19_DOCUMENTATION_REGIME: resolution.IN19_DOCUMENTATION_REGIME,
      IN19_DOCUMENTATION_REGIME_TRACE: planClone_(resolution.IN19_DOCUMENTATION_REGIME_TRACE),
    }),
    APPLICABLE_REQUIREMENTS: planMap_(applicable, item => planClone_(item)),
    WORKLIST_SMSCI: worklist,
    PLANNED_EXECUTION_UNITS: materialized.units,
    ITERATION_DOMAINS: planMap_(planFilter_(materialized.units,
      unit => unit.iterationDomain !== null), unit => ({
      unitKey: unit.unitKey, source: unit.iterationSource, values: planSlice_(unit.iterationDomain)
    })),
  };
  return planFreeze_(plan);
}

(function (global) {
  const provenance = new WeakMap();
  const internalMaterializer = materializeFrozenExecutionPlanInternal_;

  function canonicalMaterializer(contract, resolution, view) {
    planRequire_(typeof PLAN_IS_CANONICAL_CONTRACT_ === 'function' &&
      PLAN_IS_CANONICAL_CONTRACT_(contract),
    'canonical compiled runtime contract is required');
    planRequire_(typeof PLAN_IS_CANONICAL_RESOLUTION_ === 'function' &&
      PLAN_IS_CANONICAL_RESOLUTION_(resolution, view, contract),
    'canonical applicability resolution is required');
    const frozenPlan = internalMaterializer(contract, resolution);
    planRequire_(PLAN_INTRINSIC_IS_FROZEN_(frozenPlan) &&
      PLAN_INTRINSIC_ARRAY_IS_ARRAY_(frozenPlan.PLANNED_EXECUTION_UNITS) &&
      PLAN_INTRINSIC_IS_FROZEN_(frozenPlan.PLANNED_EXECUTION_UNITS),
    'canonical materializer produced an unfrozen execution plan');
    planRequire_(canonicalPlanJson_(frozenPlan.PROCESS_SMSCI) ===
      canonicalPlanJson_(resolution.PROCESS_SMSCI) &&
      frozenPlan.selectedComprovante &&
      frozenPlan.selectedComprovante.kind === resolution.selectedComprovante.kind &&
      frozenPlan.selectedComprovante.identifier === resolution.selectedComprovante.identifier,
    'canonical materializer output differs from applicability resolution');
    PLAN_INTRINSIC_APPLY_(PLAN_INTRINSIC_WEAKMAP_SET_, provenance,
      [frozenPlan, PLAN_INTRINSIC_FREEZE_({ contract, resolution, view })]);
    return frozenPlan;
  }

  function canonicalPlanVerifier(plan, contract, view) {
    const source = PLAN_INTRINSIC_APPLY_(PLAN_INTRINSIC_WEAKMAP_GET_, provenance, [plan]);
    return !!source && source.contract === contract && source.view === view &&
      typeof PLAN_IS_CANONICAL_CONTRACT_ === 'function' &&
      PLAN_IS_CANONICAL_CONTRACT_(contract) &&
      typeof PLAN_IS_CANONICAL_RESOLUTION_ === 'function' &&
      PLAN_IS_CANONICAL_RESOLUTION_(source.resolution, view, contract) &&
      PLAN_INTRINSIC_IS_FROZEN_(plan) && PLAN_INTRINSIC_ARRAY_IS_ARRAY_(plan.PLANNED_EXECUTION_UNITS) &&
      PLAN_INTRINSIC_IS_FROZEN_(plan.PLANNED_EXECUTION_UNITS);
  }

  PLAN_INTRINSIC_DEFINE_(global, 'materializeFrozenExecutionPlan', {
    value: canonicalMaterializer, enumerable: true, writable: false, configurable: false
  });
  PLAN_INTRINSIC_DEFINE_(global, 'isCanonicalFrozenExecutionPlan', {
    value: canonicalPlanVerifier, enumerable: false, writable: false, configurable: false
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      ExecutionIntegrityError,
      materializeFrozenExecutionPlan: canonicalMaterializer,
      validateExecutionPlanIntegrity,
      isCanonicalFrozenExecutionPlan: canonicalPlanVerifier,
    };
  }
})(globalThis);

PLAN_INTRINSIC_DEFINE_(global, 'ExecutionIntegrityError', {
  value: ExecutionIntegrityError, enumerable: true, writable: false, configurable: false
});
PLAN_INTRINSIC_DEFINE_(global, 'validateExecutionPlanIntegrity', {
  value: validateExecutionPlanIntegrity, enumerable: true, writable: false, configurable: false
});
})(globalThis);
