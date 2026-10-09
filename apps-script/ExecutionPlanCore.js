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
const PLAN_IS_CANONICAL_CONTRACT_ = isCanonicalCompiledRuntimeContract;
const PLAN_IS_CANONICAL_RESOLUTION_ = isCanonicalCbmscApplicabilityResolution;

function planFreeze_(value, seen) {
  if (!value || typeof value !== 'object' || PLAN_INTRINSIC_IS_FROZEN_(value)) return value;
  const active = seen || [];
  if (active.indexOf(value) >= 0) throw new ExecutionIntegrityError('cyclic execution plan');
  const next = active.concat([value]);
  Object.keys(value).forEach(key => planFreeze_(value[key], next));
  return PLAN_INTRINSIC_FREEZE_(value);
}

function planClone_(value, active) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof TypedReference) return { kind: value.kind, identifier: value.identifier };
  const ancestors = active || [];
  if (ancestors.indexOf(value) >= 0) throw new ExecutionIntegrityError('cyclic input in execution plan');
  const next = ancestors.concat([value]);
  if (Array.isArray(value)) return value.map(item => planClone_(item, next));
  const copy = {};
  Object.keys(value).sort().forEach(key => { copy[key] = planClone_(value[key], next); });
  return copy;
}

function planRequire_(condition, message) {
  if (!condition) throw new ExecutionIntegrityError(message);
}

function planIndexes_(contract) {
  planRequire_(contract && contract.contractVersion === 1, 'compiled contract version is invalid');
  const requirementById = new Map();
  (contract.requirements || []).forEach(item => {
    planRequire_(item && typeof item.requirementId === 'string' &&
      !requirementById.has(item.requirementId), 'duplicate or invalid Requirement metadata');
    requirementById.set(item.requirementId, item);
    planRequire_(['1', '4'].includes(item.table),
      'Requirement TABLE is invalid: ' + item.requirementId);
    if (item.smsci !== undefined) {
      const target = contract.entityCatalog && contract.entityCatalog[item.smsci];
      planRequire_(target && target.TYPE === 'SMSCI' && target.APPLICABILITY_TARGET_CLASS,
        'Requirement SMSCI metadata is unresolved: ' + item.requirementId);
    }
    if (item.in19DocumentationRegime !== undefined) {
      planRequire_(['CURRENT', 'LEGACY', 'UNRESOLVED'].includes(item.in19DocumentationRegime),
        'Requirement IN19 regime metadata is invalid: ' + item.requirementId);
    }
  });
  const criterionById = new Map();
  (contract.criteria || []).forEach(item => {
    planRequire_(item && typeof item.criterionId === 'string' &&
      !criterionById.has(item.criterionId), 'duplicate or invalid Criterion metadata');
    criterionById.set(item.criterionId, item);
    planRequire_(['1', '4'].includes(item.table),
      'Criterion TABLE is invalid: ' + item.criterionId);
    if (item.appliesTo !== undefined) {
      const target = contract.entityCatalog && contract.entityCatalog[item.appliesTo];
      planRequire_(target && target.TYPE === 'SMSCI' && target.APPLICABILITY_TARGET_CLASS,
        'Criterion APPLIES_TO metadata is unresolved: ' + item.criterionId);
    }
  });
  const nonconformities = contract.nonconformities || {};
  const indexByRequirement = new Map();
  (contract.compiledExecutionIndex || []).forEach(block => {
    planRequire_(block && requirementById.has(block.requirementId) &&
      !indexByRequirement.has(block.requirementId), 'invalid or duplicate compiled Requirement block');
    indexByRequirement.set(block.requirementId, block);
  });
  planRequire_(requirementById.size === indexByRequirement.size,
    'compiled index has missing or extra Requirement blocks');
  planRequire_(canonicalPlanJson_(Array.from(indexByRequirement.keys())) ===
    canonicalPlanJson_(Array.from(requirementById.keys())),
  'compiled Requirement order differs from canonical metadata');
  const indexedCriteria = new Set();
  for (const requirement of requirementById.values()) {
    const indexBlock = indexByRequirement.get(requirement.requirementId);
    planRequire_(indexBlock, 'compiled index missing Requirement: ' + requirement.requirementId);
    for (const ncId of requirement.nonconformities || []) {
      planRequire_(Object.prototype.hasOwnProperty.call(nonconformities, ncId) &&
        nonconformities[ncId].REF_REQUIREMENT === requirement.requirementId,
      'invalid Requirement Nonconformity reference: ' + ncId);
    }
    const seenKeys = new Set();
    (indexBlock.units || []).forEach(unit => {
      planRequire_(unit && typeof unit.unitKey === 'string' && !seenKeys.has(unit.unitKey),
        'duplicate or invalid UNIT_KEY in compiled index');
      seenKeys.add(unit.unitKey);
      const criterion = criterionById.get(unit.criterionId);
      planRequire_(unit.requirementId === requirement.requirementId && criterion &&
        criterion.requirementId === requirement.requirementId &&
        unit.unitKey === 'UNIT_KEY (' + requirement.requirementId + ', ' + criterion.criterionId + ')',
      'Criterion association mismatch for UNIT_KEY: ' + unit.unitKey);
      if (criterion.appliesTo !== undefined) {
        planRequire_(requirement.smsci === criterion.appliesTo,
          'Criterion APPLIES_TO differs from associated Requirement SMSCI: ' + criterion.criterionId);
      }
      planRequire_(!indexedCriteria.has(criterion.criterionId),
        'Criterion appears more than once in compiled index: ' + criterion.criterionId);
      indexedCriteria.add(criterion.criterionId);
      planRequire_(criterion.forEach === (requirement.forEach || null),
        'Criterion FOR_EACH differs from Requirement: ' + criterion.criterionId);
      for (const ncId of criterion.failNonconformities || []) {
        const nc = nonconformities[ncId];
        planRequire_(nc && nc.REF_REQUIREMENT === requirement.requirementId &&
          nc.REF_CRITERION === criterion.criterionId && nc.TABLE === criterion.table,
        'invalid Criterion Nonconformity reference: ' + ncId);
      }
    });
  }
  planRequire_(indexedCriteria.size === criterionById.size,
    'compiled index has missing or extra Criterion metadata');
  for (const criterion of criterionById.values()) {
    planRequire_(requirementById.has(criterion.requirementId),
      'Criterion references missing Requirement: ' + criterion.criterionId);
  }
  for (const ncId of Object.keys(nonconformities)) {
    const nc = nonconformities[ncId];
    planRequire_(requirementById.has(nc.REF_REQUIREMENT) && criterionById.has(nc.REF_CRITERION) &&
      criterionById.get(nc.REF_CRITERION).requirementId === nc.REF_REQUIREMENT &&
      nc.TABLE === criterionById.get(nc.REF_CRITERION).table,
    'Nonconformity reference is unresolved: ' + ncId);
  }
  return { requirementById, criterionById, indexByRequirement };
}

function applicableRequirements_(contract, resolution, indexes) {
  planRequire_(resolution && Array.isArray(resolution.PROCESS_SMSCI),
    'applicability resolution has no complete PROCESS.SMSCI');
  const officialTargets = contract.officialEsciTargets || [];
  planRequire_(officialTargets.length === 28 &&
    (resolution.officialDecisions || []).length === 28,
    'applicability resolution is not complete for all official targets');
  const decisions = resolution.officialDecisions;
  const officialTargetsInOrder = officialTargets.map(item => item.entityId);
  planRequire_(new Set(officialTargetsInOrder).size === 28 &&
    canonicalPlanJson_(decisions.map(item => item.target)) === canonicalPlanJson_(officialTargetsInOrder),
  'official decisions have missing, extra, duplicate or reordered targets');
  const positiveOfficial = [];
  decisions.forEach((decision, index) => {
    const target = officialTargets[index];
    const documentRef = decision.selectedDocument && decision.selectedDocument.reference;
    const sectionRef = decision.section && decision.section.reference;
    planRequire_(['POSITIVE', 'NEGATIVE'].includes(decision.decision) &&
      decision.code === target.code && documentRef && documentRef.kind === 'DOCUMENT' &&
      sectionRef && sectionRef.kind === 'DOCUMENT_SECTION' &&
      decision.rule && decision.source === 'OFFICIAL_ESCI_CODE' &&
      Array.isArray(decision.itemReferences) && Array.isArray(decision.itemTraces),
    'official decision trace is incomplete: ' + target.entityId);
    planRequire_(decision.itemReferences.length === decision.itemTraces.length &&
      (decision.decision !== 'POSITIVE' || decision.itemReferences.length > 0) &&
      (decision.decision !== 'NEGATIVE' || decision.itemReferences.length === 0),
    'official decision evidence trace disagrees with its decision: ' + target.entityId);
    decision.itemTraces.forEach((trace, traceIndex) => {
      const itemReference = decision.itemReferences[traceIndex];
      planRequire_(trace && itemReference && itemReference.kind === 'DOCUMENTARY_EVIDENCE' &&
      typeof itemReference.identifier === 'string' && trace.reference &&
      trace.reference.kind === 'DOCUMENTARY_EVIDENCE' &&
      trace.reference.identifier === itemReference.identifier &&
      trace.sourceDocument && trace.sourceDocument.kind === 'DOCUMENT' &&
      trace.sourceDocument.identifier === documentRef.identifier,
      'official decision item trace is incomplete: ' + target.entityId);
    });
    if (decision.decision === 'POSITIVE') positiveOfficial.push(target.entityId);
  });
  const derived = resolution.derivedDecisions || [];
  const expectedDerivedTargets = ['SMSCI_SDAI', 'SMSCI_IN19_APPLICABILITY_REVIEW'];
  planRequire_(canonicalPlanJson_(derived.map(item => item.target)) ===
    canonicalPlanJson_(expectedDerivedTargets), 'derived applicability decisions are incomplete');
  derived.forEach(item => planRequire_(
    ['POSITIVE', 'NEGATIVE'].includes(item.decision) && item.rule &&
      Array.isArray(item.sourceDecisions) && item.selectedDocument && item.section,
    'derived applicability trace is incomplete: ' + item.target
  ));
  planRequire_(resolution.selectedComprovante &&
    resolution.selectedComprovante.kind === 'DOCUMENT' &&
    resolution.officialDecisions.every(item =>
      item.selectedDocument.reference.identifier === resolution.selectedComprovante.identifier &&
      item.section.reference.identifier === resolution.officialDecisions[0].section.reference.identifier
    ), 'applicability decisions do not share one selected document and section');
  const contextProvenance = resolution.currentSubmissionProvenance;
  planRequire_(contextProvenance && typeof contextProvenance.sourceKind === 'string' &&
    contextProvenance.sourceKind.length > 0 && typeof contextProvenance.sourceReference === 'string' &&
    contextProvenance.sourceReference.length > 0,
  'current submission operational provenance is incomplete');
  const decisionByTarget = new Map(decisions.map(item => [item.target, item]));
  const derivedByTarget = new Map(derived.map(item => [item.target, item]));
  const expectedSdai = decisionByTarget.get('SMSCI_AI').decision === 'POSITIVE' ||
    decisionByTarget.get('SMSCI_DAI').decision === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE';
  const expectedReview = decisionByTarget.get('SMSCI_IEL').decision === 'POSITIVE'
    ? 'NEGATIVE' : 'POSITIVE';
  planRequire_(derivedByTarget.get('SMSCI_SDAI').decision === expectedSdai &&
    canonicalPlanJson_(derivedByTarget.get('SMSCI_SDAI').sourceDecisions) ===
      canonicalPlanJson_(['SMSCI_AI', 'SMSCI_DAI']),
  'SMSCI_SDAI derivation is inconsistent with AI/DAI decisions');
  planRequire_(derivedByTarget.get('SMSCI_IN19_APPLICABILITY_REVIEW').decision === expectedReview &&
    canonicalPlanJson_(derivedByTarget.get('SMSCI_IN19_APPLICABILITY_REVIEW').sourceDecisions) ===
      canonicalPlanJson_(['SMSCI_IEL']),
  'IN19 applicability-review derivation is inconsistent with IEL decision');
  const processTargets = resolution.PROCESS_SMSCI;
  const processSet = new Set(processTargets);
  planRequire_(processSet.size === processTargets.length, 'PROCESS.SMSCI contains duplicate targets');
  const expectedProcess = positiveOfficial.concat(
    derived.filter(item => item.decision === 'POSITIVE').map(item => item.target)
  );
  planRequire_(canonicalPlanJson_(processTargets) === canonicalPlanJson_(expectedProcess),
    'PROCESS.SMSCI does not equal the complete positive official and derived scopes');
  const regime = resolution.IN19_DOCUMENTATION_REGIME;
  const ielPositive = decisions.find(item => item.target === 'SMSCI_IEL').decision === 'POSITIVE';
  if (ielPositive) {
    planRequire_(['CURRENT', 'LEGACY'].includes(regime), 'positive SMSCI_IEL requires CURRENT or LEGACY');
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
  for (const source of contract.requirements) {
    if (source.smsci && !processSet.has(source.smsci)) continue;
    if (source.in19DocumentationRegime !== undefined &&
        source.in19DocumentationRegime !== regime) continue;
    planRequire_(indexes.requirementById.has(source.requirementId),
      'applicable Requirement is absent from compiled contract');
    result.push(source);
  }
  return result;
}

function worklistSmsci_(contract, resolution) {
  const positive = new Set(resolution.PROCESS_SMSCI);
  return contract.officialEsciTargets
    .filter(target => positive.has(target.entityId))
    .map(target => target.entityId);
}

function expectedPlannedUnits_(contract, resolution, applicable, worklist, indexes) {
  const processSet = new Set(resolution.PROCESS_SMSCI);
  const units = [];
  const expectedKeys = [];
  for (const requirement of applicable) {
    const block = indexes.indexByRequirement.get(requirement.requirementId);
    planRequire_(block && Array.isArray(block.units) && block.units.length,
      'compiled index block is empty or missing: ' + requirement.requirementId);
    planRequire_(block.iterationSource === (requirement.forEach || null),
      'ITERATION_SOURCE differs from Requirement FOR_EACH: ' + requirement.requirementId);
    for (const indexUnit of block.units) {
      const criterion = indexes.criterionById.get(indexUnit.criterionId);
      planRequire_(criterion && criterion.requirementId === requirement.requirementId,
        'Criterion association mismatch: ' + indexUnit.unitKey);
      planRequire_(criterion.table === '1' || criterion.table === '4',
        'Criterion TABLE is incompatible: ' + criterion.criterionId);
      if (criterion.appliesTo !== undefined) {
        planRequire_(requirement.smsci === criterion.appliesTo,
          'APPLIES_TO differs from associated Requirement SMSCI: ' + criterion.criterionId);
        planRequire_(processSet.has(criterion.appliesTo),
          'APPLIES_TO is inconsistent with PROCESS.SMSCI: ' + criterion.criterionId);
      }
      const unitRequirementNCs = requirement.nonconformities || [];
      const criterionNCs = criterion.failNonconformities || [];
      for (const ncId of [...unitRequirementNCs, ...criterionNCs]) {
        planRequire_(Object.prototype.hasOwnProperty.call(contract.nonconformities, ncId),
          'Nonconformity reference is absent: ' + ncId);
      }
      let iterationDomain = null;
      if (block.iterationSource !== null) {
        planRequire_(block.iterationSource === 'WORKLIST.SMSCI',
          'unknown ITERATION_SOURCE: ' + block.iterationSource);
        iterationDomain = worklist.slice();
      }
      expectedKeys.push(indexUnit.unitKey);
      units.push({
        unitKey: indexUnit.unitKey,
        requirement: { id: requirement.requirementId },
        criterion: { id: criterion.criterionId },
        requirementTable: requirement.table,
        criterionTable: criterion.table,
        context: criterion.context === undefined ? null : criterion.context,
        validate: (requirement.validate || []).slice(),
        criterionValidate: (criterion.validate || []).slice(),
        appliesTo: criterion.appliesTo === undefined ? null : criterion.appliesTo,
        iterationSource: block.iterationSource,
        iterationDomain,
        plannedBindings: iterationDomain === null ? [] : iterationDomain.map(target => ({ target })),
        nonconformityReferences: {
          requirement: unitRequirementNCs.slice(),
          criterionFail: criterionNCs.slice(),
        },
      });
    }
  }
  if (new Set(expectedKeys).size !== expectedKeys.length) {
    throw new ExecutionIntegrityError('UNIT_KEY duplicated across applicable Requirements');
  }
  return { units, expectedKeys };
}

function canonicalPlanJson_(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalPlanJson_).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(key =>
      JSON.stringify(key) + ':' + canonicalPlanJson_(value[key])
    ).join(',') + '}';
  }
  return JSON.stringify(value);
}

/** Public integrity gate also used to reject missing, extra, duplicate or altered units. */
function validateExecutionPlanIntegrity(contract, resolution, applicableIds, worklist, plannedUnits) {
  const indexes = planIndexes_(contract);
  planRequire_(Array.isArray(applicableIds) && Array.isArray(worklist) && Array.isArray(plannedUnits),
    'plan integrity inputs must be arrays');
  const applicable = applicableIds.map(id => {
    const requirement = indexes.requirementById.get(id);
    planRequire_(requirement, 'Requirement does not exist: ' + id);
    return requirement;
  });
  const expectedApplicable = applicableRequirements_(contract, resolution, indexes)
    .map(item => item.requirementId);
  planRequire_(canonicalPlanJson_(applicableIds) === canonicalPlanJson_(expectedApplicable),
    'APPLICABLE_REQUIREMENTS is missing, extra or out of canonical order');
  const expectedWorklist = worklistSmsci_(contract, resolution);
  planRequire_(canonicalPlanJson_(worklist) === canonicalPlanJson_(expectedWorklist),
    'WORKLIST.SMSCI is missing, extra or out of canonical order');
  const expected = expectedPlannedUnits_(contract, resolution, applicable, worklist, indexes);
  const actualKeys = plannedUnits.map(unit => unit && unit.unitKey);
  planRequire_(new Set(actualKeys).size === actualKeys.length,
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
  const applicableIds = applicable.map(item => item.requirementId);
  const worklist = worklistSmsci_(contract, resolution);
  const materialized = expectedPlannedUnits_(contract, resolution, applicable, worklist, indexes);
  validateExecutionPlanIntegrity(
    contract, resolution, applicableIds, worklist, materialized.units
  );
  const plan = {
    selectedComprovante: planClone_(resolution.selectedComprovante),
    officialDecisions: planClone_(resolution.officialDecisions),
    derivedDecisions: planClone_(resolution.derivedDecisions),
    PROCESS_SMSCI: resolution.PROCESS_SMSCI.slice(),
    ...(resolution.IN19_DOCUMENTATION_REGIME === undefined ? {} : {
      IN19_DOCUMENTATION_REGIME: resolution.IN19_DOCUMENTATION_REGIME,
      IN19_DOCUMENTATION_REGIME_TRACE: planClone_(resolution.IN19_DOCUMENTATION_REGIME_TRACE),
    }),
    APPLICABLE_REQUIREMENTS: applicable.map(item => planClone_(item)),
    WORKLIST_SMSCI: worklist,
    PLANNED_EXECUTION_UNITS: materialized.units,
    ITERATION_DOMAINS: materialized.units.filter(unit => unit.iterationDomain !== null)
      .map(unit => ({ unitKey: unit.unitKey, source: unit.iterationSource, values: unit.iterationDomain.slice() })),
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
