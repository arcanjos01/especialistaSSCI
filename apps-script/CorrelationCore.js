(function (global) {
  'use strict';

  const decisions = new WeakMap();
  const weakMapGet = WeakMap.prototype.get;
  const weakMapSet = WeakMap.prototype.set;
  const weakMapHas = WeakMap.prototype.has;
  const apply = Reflect.apply;
  const freeze = Object.freeze;
  const isFrozen = Object.isFrozen;
  const getDescriptor = Object.getOwnPropertyDescriptor;
  const getNames = Object.getOwnPropertyNames;
  const getSymbols = Object.getOwnPropertySymbols;
  const getPrototype = Object.getPrototypeOf;
  const objectKeys = Object.keys;
  const objectCreate = Object.create;
  const defineProperty = Object.defineProperty;
  const objectToString = Object.prototype.toString;
  const arrayIsArray = Array.isArray;
  const arrayIncludes = Array.prototype.includes;
  const arrayEvery = Array.prototype.every;
  const arrayMap = Array.prototype.map;
  const arraySome = Array.prototype.some;
  const arrayPush = Array.prototype.push;
  const arraySlice = Array.prototype.slice;
  const arraySort = Array.prototype.sort;
  const arrayConcat = Array.prototype.concat;
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const jsonStringify = JSON.stringify;
  const isFiniteNumber = Number.isFinite;
  const isInteger = Number.isInteger;
  const stringConstructor = String;
  const stringPadStart = String.prototype.padStart;
  const stringTrim = String.prototype.trim;
  const objectPrototype = Object.prototype;
  const THRESHOLD = 0.80;
  const DRT_PRODUCT_BINDING_TYPE = 'DRT_TO_TECHNICAL_PRODUCT';
  const runtimeUtilities = Utilities;
  const utilitiesNewBlob = runtimeUtilities.newBlob;
  const utilitiesComputeDigest = runtimeUtilities.computeDigest;
  const sha256 = runtimeUtilities.DigestAlgorithm.SHA_256;
  const isCanonicalContract = isCanonicalCompiledRuntimeContract;
  const isCanonicalPlan = isCanonicalFrozenExecutionPlan;
  const isCanonicalView = isImmutableExecutionView;
  const isCanonicalSubmission = isCanonicalCurrentSubmissionContext;
  const getPresentationIdentity = getAuthenticatedPresentationIdentity;
  const isCanonicalRde = isCanonicalValidatedExecutionRde_;
  const getRdeDigest = getValidatedRdeDigest_;
  const isCanonicalRdeDigest = isCanonicalValidatedRdeDigest_;
  const isViewDerivedFromRde = isExecutionViewDerivedFromRde_;
  const snapshotViewRecords = snapshotImmutableExecutionViewEntityRecords;
  const TypedRef = TypedReference;
  const selectComprovante = selectCurrentComprovante;
  const getAuthenticatedConfigurationEntry = getAuthenticatedCorrelationConfigurationEntry_;
  const loadAuthenticatedConfiguration = loadAuthenticatedCorrelationConfiguration_;
  const verifyConflictAssessment = verifyCorrelationAssessment_;
  const verifyEmpiricalCalibration = verifyEmpiricalCalibration_;

  function contains(array, value) { return apply(arrayIncludes, array, [value]); }
  function append(array, value) { apply(arrayPush, array, [value]); }

  class CorrelationContractError extends Error {
    constructor(message) {
      super(message);
      this.name = 'CorrelationContractError';
      this.code = 'CORRELATION_BLOCKED';
    }
  }

  function fail(message) {
    throw new CorrelationContractError(message);
  }

  function hasOwn(value, key) {
    return apply(hasOwnProperty, value, [key]);
  }

  function isPlainObject(value) {
    if (!value || typeof value !== 'object' || arrayIsArray(value)) return false;
    const prototype = getPrototype(value);
    if (prototype === objectPrototype || prototype === null) return true;
    const constructor = prototype && getDescriptor(prototype, 'constructor');
    return getPrototype(prototype) === null &&
      apply(objectToString, value, []) === '[object Object]' && constructor &&
      hasOwn(constructor, 'value') && typeof constructor.value === 'function' &&
      constructor.value.name === 'Object';
  }

  function hasOnlyDataProperties(value, expectedKeys) {
    if (!isPlainObject(value) || getSymbols(value).length !== 0) return false;
    const names = getNames(value);
    if (names.length !== expectedKeys.length) return false;
    for (let index = 0; index < expectedKeys.length; index += 1) {
      const name = expectedKeys[index];
      if (!hasOwn(value, name)) return false;
      const descriptor = getDescriptor(value, name);
      if (!descriptor || !hasOwn(descriptor, 'value')) return false;
    }
    return apply(arrayEvery, names, [name => contains(expectedKeys, name)]);
  }

  function copyFrozen(value, active) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && isFiniteNumber(value)) return value;
    if (!value || typeof value !== 'object' || contains(active, value)) {
      fail('correlation data must be acyclic JSON data');
    }
    const next = apply(arrayConcat, active, [[value]]);
    if (arrayIsArray(value)) {
      if (getSymbols(value).length || getNames(value).length !== value.length + 1) {
        fail('correlation arrays must be dense data arrays');
      }
      const result = [];
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = getDescriptor(value, stringConstructor(index));
        if (!descriptor || !hasOwn(descriptor, 'value')) fail('correlation arrays cannot contain accessors');
        append(result, copyFrozen(descriptor.value, next));
      }
      return freeze(result);
    }
    if (!isPlainObject(value) || getSymbols(value).length) fail('correlation objects must be plain JSON data');
    const result = objectCreate(null);
    const keys = apply(arraySort, objectKeys(value), []);
    if (getNames(value).length !== keys.length) fail('correlation objects cannot contain hidden properties');
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
      const key = keys[keyIndex];
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        fail('correlation objects cannot contain prototype keys');
      }
      const descriptor = getDescriptor(value, key);
      if (!descriptor || !hasOwn(descriptor, 'value')) fail('correlation objects cannot contain accessors');
      defineProperty(result, key, {
        value: copyFrozen(descriptor.value, next), enumerable: true, writable: false, configurable: false
      });
    }
    return freeze(result);
  }

  function canonicalJson(value) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return jsonStringify(value);
    if (typeof value === 'number' && isFiniteNumber(value)) return jsonStringify(value);
    if (arrayIsArray(value)) return '[' + apply(arrayMap, value, [canonicalJson]).join(',') + ']';
    if (!isPlainObject(value)) fail('canonical correlation data must be JSON data');
    const keys = apply(arraySort, objectKeys(value), []);
    return '{' + apply(arrayMap, keys, [key => {
      const descriptor = getDescriptor(value, key);
      if (!descriptor || !hasOwn(descriptor, 'value')) fail('canonical data cannot contain accessors');
      return jsonStringify(key) + ':' + canonicalJson(descriptor.value);
    }]).join(',') + '}';
  }

  function hashCanonical(value) {
    const bytes = apply(utilitiesNewBlob, runtimeUtilities, [canonicalJson(value)]).getBytes();
    const digestBytes = apply(utilitiesComputeDigest, runtimeUtilities, [sha256, bytes]);
    return apply(arrayMap, digestBytes, [byte => apply(stringPadStart,
      ((byte + 256) % 256).toString(16), ['2', '0'])]).join('');
  }

  function authenticateContext(contract, view, context, rde) {
    if (typeof isCanonicalContract !== 'function' || !isCanonicalContract(contract)) {
      fail('canonical compiled contract required');
    }
    if (typeof isCanonicalView !== 'function' || !isCanonicalView(view)) {
      fail('canonical immutable execution view required');
    }
    if (typeof isCanonicalSubmission !== 'function' || !isCanonicalSubmission(context)) {
      fail('authenticated presentation identity required');
    }
    if (typeof selectComprovante !== 'function') fail('canonical presentation selector required');
    const selected = selectComprovante(view, context);
    if (typeof isCanonicalRde !== 'function' || !isCanonicalRde(rde) || typeof getRdeDigest !== 'function') {
      fail('parser-authenticated validated RDE required');
    }
    const digest = getRdeDigest(rde);
    if (typeof isViewDerivedFromRde !== 'function' || !isViewDerivedFromRde(view, rde, digest)) {
      fail('execution view is not derived from the exact validated RDE');
    }
    return digest;
  }

  function authenticatePlan(contract, plan, view, context) {
    if (typeof isCanonicalPlan !== 'function' || !isCanonicalPlan(plan, contract, view)) {
      fail('canonical frozen execution plan required');
    }
    const selected = selectComprovante(view, context);
    if (!plan.selectedComprovante || plan.selectedComprovante.kind !== selected.kind ||
        plan.selectedComprovante.identifier !== selected.identifier) {
      fail('presentation identity does not match the frozen plan');
    }
  }

  function makeReferenceKey(reference) {
    return jsonStringify([reference.kind, reference.identifier]);
  }

  function resolveReference(contract, view, input) {
    if (!hasOnlyDataProperties(input, ['kind', 'identifier']) ||
        typeof input.kind !== 'string' || !input.kind ||
        typeof input.identifier !== 'string' || !input.identifier) {
      fail('candidate reference must be an exact typed reference');
    }
    const reference = new TypedRef(input.kind, input.identifier);
    const entityIds = objectKeys(contract.entityCatalog || {});
    let match = null;
    for (let entityIndex = 0; entityIndex < entityIds.length; entityIndex += 1) {
      const entityId = entityIds[entityIndex];
      const definition = contract.entityCatalog[entityId];
      if (!definition || definition.TYPE !== input.kind) continue;
      const records = snapshotViewRecords(view, entityId);
      for (let recordIndex = 0; recordIndex < records.length; recordIndex += 1) {
        const record = records[recordIndex];
        if (makeReferenceKey(record.reference) !== makeReferenceKey(reference)) continue;
        if (match) fail('candidate reference is ambiguous in the execution view');
        match = record;
      }
    }
    if (!match) fail('candidate reference is orphaned from the execution view');
    return match;
  }

  function technicalProductIds(contract) {
    const ids = [];
    const requirements = contract.requirements || [];
    for (let requirementIndex = 0; requirementIndex < requirements.length; requirementIndex += 1) {
      const requirement = requirements[requirementIndex];
      if (requirement && typeof requirement.technicalProduct === 'string' &&
          contract.entityCatalog[requirement.technicalProduct] && !contains(ids, requirement.technicalProduct)) {
        append(ids, requirement.technicalProduct);
      }
    }
    return ids;
  }

  function hasUsableProvenance(provenance) {
    if (!isPlainObject(provenance)) return false;
    const hasString = key => typeof provenance[key] === 'string' &&
      apply(stringTrim, provenance[key], []).length > 0;
    const hasPositiveInteger = key => isInteger(provenance[key]) && provenance[key] > 0;
    return (hasString('sourceKind') && hasString('sourceReference')) || hasPositiveInteger('page') ||
      hasPositiveInteger('row') || hasPositiveInteger('column') || hasString('text_span') ||
      hasString('location') || hasString('attachment');
  }

  function expectedCandidatePairs(contract, view, policy) {
    const drtRecords = [];
    const productRecords = [];
    const entityIds = objectKeys(contract.entityCatalog || {});
    const productIds = policy.technicalProductIds;
    for (let entityIndex = 0; entityIndex < entityIds.length; entityIndex += 1) {
      const entityId = entityIds[entityIndex];
      const definition = contract.entityCatalog[entityId];
      if (!definition || definition.TYPE !== 'DOCUMENT' || definition.ABSTRACT === true ||
          definition.EXTENDS !== 'DRT') continue;
      const records = snapshotViewRecords(view, entityId);
      for (let recordIndex = 0; recordIndex < records.length; recordIndex += 1) append(drtRecords, records[recordIndex]);
    }
    for (let productIndex = 0; productIndex < productIds.length; productIndex += 1) {
      const records = snapshotViewRecords(view, productIds[productIndex]);
      for (let recordIndex = 0; recordIndex < records.length; recordIndex += 1) append(productRecords, records[recordIndex]);
    }
    const pairs = [];
    for (let drtIndex = 0; drtIndex < drtRecords.length; drtIndex += 1) {
      for (let productIndex = 0; productIndex < productRecords.length; productIndex += 1) {
        append(pairs, freeze({ drtSource: drtRecords[drtIndex].reference,
          technicalProductTarget: productRecords[productIndex].reference }));
      }
    }
    return pairs;
  }

  function conflictAssessmentPayload(candidate, assessment, digest, presentation, policyDigest) {
    return canonicalJson({
      schemaVersion: '1.0.0', rdeDigest: digest, presentation, policyDigest,
      candidateId: candidate.candidateId, drtSource: candidate.drtSource,
      technicalProductTarget: candidate.technicalProductTarget, score: candidate.score,
      candidateEvidenceRefs: candidate.evidenceRefs, conflictFlags: candidate.conflictFlags,
      outcome: assessment.outcome,
      detectorId: assessment.detectorId, detectorVersion: assessment.detectorVersion,
      evidenceRefs: assessment.evidenceRefs
    });
  }

  function validatePolicy(contract, policy) {
    const keys = ['policyId', 'version', 'baseId', 'bindingType', 'threshold',
      'technicalProductIds', 'conflictDetectorId', 'conflictDetectorVersion'];
    if (!hasOnlyDataProperties(policy, keys) ||
        typeof policy.policyId !== 'string' || !policy.policyId ||
        typeof policy.version !== 'string' || !policy.version ||
        !contract.knowledgeBase || policy.baseId !== contract.knowledgeBase.id ||
        policy.bindingType !== DRT_PRODUCT_BINDING_TYPE ||
        typeof policy.threshold !== 'number' || !isFiniteNumber(policy.threshold) ||
        policy.threshold < 0 || policy.threshold > 1 ||
        typeof policy.conflictDetectorId !== 'string' || !policy.conflictDetectorId ||
        typeof policy.conflictDetectorVersion !== 'string' || !policy.conflictDetectorVersion ||
        !arrayIsArray(policy.technicalProductIds) || policy.technicalProductIds.length === 0 ||
        apply(arraySome, policy.technicalProductIds, [id => typeof id !== 'string' || !id ||
          !contains(technicalProductIds(contract), id)])) {
      fail('versioned policy must be valid for the active Knowledge Base and binding type');
    }
    return copyFrozen(policy, []);
  }

  function applicableCalibration(policy, policyDigest, calibrations) {
    let selected = null;
    let matches = 0;
    for (let index = 0; index < calibrations.length; index += 1) {
      const calibration = calibrations[index];
      if (!calibration || calibration.baseId !== policy.baseId ||
          calibration.bindingType !== policy.bindingType || calibration.policyDigest !== policyDigest) continue;
      matches += 1;
      if (matches > 1) return null;
      const keys = ['calibrationId', 'version', 'baseId', 'bindingType', 'policyDigest',
        'datasetHash', 'validity', 'status', 'conflictDetectorId', 'conflictDetectorVersion',
        'validationEvidenceDigest', 'validationRecordId', 'validationStatus', 'validationSignature'];
      if (!hasOnlyDataProperties(calibration, keys) ||
          calibration.baseId !== policy.baseId || calibration.bindingType !== policy.bindingType ||
          calibration.policyDigest !== policyDigest || typeof calibration.calibrationId !== 'string' ||
          !calibration.calibrationId || typeof calibration.version !== 'string' || !calibration.version ||
          calibration.conflictDetectorId !== policy.conflictDetectorId ||
          calibration.conflictDetectorVersion !== policy.conflictDetectorVersion ||
          typeof calibration.validationEvidenceDigest !== 'string' ||
          !/^[0-9a-f]{64}$/.test(calibration.validationEvidenceDigest) ||
          typeof calibration.validationRecordId !== 'string' || !calibration.validationRecordId ||
          calibration.validationStatus !== 'EMPIRICALLY_VALIDATED' ||
          typeof verifyEmpiricalCalibration !== 'function' || !verifyEmpiricalCalibration(calibration) ||
          typeof calibration.datasetHash !== 'string' || !/^[0-9a-f]{64}$/.test(calibration.datasetHash) ||
          calibration.validity !== 'VALID' || calibration.status !== 'VALID') return null;
      selected = copyFrozen(calibration, []);
    }
    return matches === 1 ? selected : null;
  }

  function validateCandidate(contract, view, candidate, policy, policyDigest, digest, presentation) {
    const candidateKeys = ['candidateId', 'drtSource', 'technicalProductTarget', 'evidenceRefs',
      'score', 'conflictFlags', 'conflictAssessment'];
    if (!hasOnlyDataProperties(candidate, candidateKeys) ||
        typeof candidate.candidateId !== 'string' || !candidate.candidateId ||
        typeof candidate.score !== 'number' || !isFiniteNumber(candidate.score) ||
        candidate.score < 0 || candidate.score > 1 ||
        !arrayIsArray(candidate.evidenceRefs) || candidate.evidenceRefs.length === 0 ||
        !arrayIsArray(candidate.conflictFlags) ||
        apply(arraySome, candidate.conflictFlags, [flag => typeof flag !== 'string' || !flag])) {
      fail('candidate schema, calibrated score or flags are invalid');
    }
    const assessment = candidate.conflictAssessment;
    if (!hasOnlyDataProperties(assessment, ['outcome', 'detectorId', 'detectorVersion', 'evidenceRefs', 'signature']) ||
        !contains(['NO_MATERIAL_CONFLICT', 'MATERIAL_CONFLICT', 'INDETERMINATE'], assessment.outcome) ||
        typeof assessment.detectorId !== 'string' || !assessment.detectorId ||
        typeof assessment.detectorVersion !== 'string' || !assessment.detectorVersion ||
        !arrayIsArray(assessment.evidenceRefs) || assessment.evidenceRefs.length === 0 ||
        typeof assessment.signature !== 'string' || !assessment.signature) {
      fail('candidate requires an explicit, evidence-referenced conflict assessment');
    }

    const drt = resolveReference(contract, view, candidate.drtSource);
    const drtDefinition = contract.entityCatalog[drt.entityId];
    if (!drtDefinition || drtDefinition.TYPE !== 'DOCUMENT' || drtDefinition.EXTENDS !== 'DRT' ||
        drtDefinition.ABSTRACT === true || drt.reference.kind !== 'DOCUMENT' ||
        drt.sourceDocument.identifier !== drt.reference.identifier ||
        drt.sourceDocument.kind !== drt.reference.kind) {
      fail('source reference must resolve to a standalone concrete DRT');
    }

    const product = resolveReference(contract, view, candidate.technicalProductTarget);
    if (!contains(technicalProductIds(contract), product.entityId) ||
        !contains(policy.technicalProductIds, product.entityId)) {
      fail('target reference must resolve to a product declared by policy and Requirement');
    }

    const evidence = [];
    let assessmentSourceReferenced = false;
    let assessmentProductReferenced = false;
    for (let assessmentIndex = 0; assessmentIndex < assessment.evidenceRefs.length; assessmentIndex += 1) {
      const assessmentRef = assessment.evidenceRefs[assessmentIndex];
      const assessmentRecord = resolveReference(contract, view, assessmentRef);
      const evidenceKey = makeReferenceKey(assessmentRecord.reference);
      let foundInCandidateEvidence = false;
      for (let evidenceIndex = 0; evidenceIndex < candidate.evidenceRefs.length; evidenceIndex += 1) {
        if (makeReferenceKey(candidate.evidenceRefs[evidenceIndex]) === evidenceKey) foundInCandidateEvidence = true;
      }
      if (!foundInCandidateEvidence) fail('conflict assessment references must be included in candidate evidence');
      if (evidenceKey === makeReferenceKey(drt.reference)) assessmentSourceReferenced = true;
      if (evidenceKey === makeReferenceKey(product.reference)) assessmentProductReferenced = true;
    }
    const conflictAssessmentUsable = assessment.detectorId === policy.conflictDetectorId &&
      assessment.detectorVersion === policy.conflictDetectorVersion &&
      assessmentSourceReferenced && assessmentProductReferenced &&
      typeof verifyConflictAssessment === 'function' && verifyConflictAssessment(
        conflictAssessmentPayload(candidate, assessment, digest, presentation, policyDigest), assessment.signature
      );
    const assessmentFlags = [];
    if (!conflictAssessmentUsable || assessment.outcome === 'INDETERMINATE') {
      append(assessmentFlags, 'CONFLICT_ASSESSMENT_INSUFFICIENT');
    }
    if (assessment.outcome === 'MATERIAL_CONFLICT') append(assessmentFlags, 'MATERIAL_CONFLICT');
    let sourceEndpointProvenance = false;
    let targetEndpointProvenance = false;
    for (let evidenceIndex = 0; evidenceIndex < candidate.evidenceRefs.length; evidenceIndex += 1) {
      const evidenceInput = candidate.evidenceRefs[evidenceIndex];
      const record = resolveReference(contract, view, evidenceInput);
      if (!record.sourceDocument || !record.sourceDocument.kind || !record.sourceDocument.identifier) {
        fail('evidence reference lacks an authenticated source document');
      }
      const source = resolveReference(contract, view, record.sourceDocument);
      const provenance = record.provenance ? copyFrozen(record.provenance, []) : null;
      const provenanceSufficient = !!provenance && hasUsableProvenance(provenance);
      const referenceKey = makeReferenceKey(record.reference);
      if (referenceKey === makeReferenceKey(drt.reference) && provenanceSufficient) sourceEndpointProvenance = true;
      if (referenceKey === makeReferenceKey(product.reference) && provenanceSufficient) targetEndpointProvenance = true;
      append(evidence, freeze({
        reference: freeze({ kind: record.reference.kind, identifier: record.reference.identifier }),
        sourceDocument: freeze({ kind: source.reference.kind, identifier: source.reference.identifier }),
        provenance,
        provenanceSufficient
      }));
    }

    return freeze({
      candidateId: candidate.candidateId,
      drtSource: freeze({ kind: drt.reference.kind, identifier: drt.reference.identifier }),
      technicalProductTarget: freeze({ kind: product.reference.kind, identifier: product.reference.identifier }),
      evidence: freeze(evidence),
      score: candidate.score,
      conflictFlags: copyFrozen(candidate.conflictFlags, []),
      conflictAssessment: copyFrozen(assessment, []),
      conflictAssessmentUsable,
      assessmentFlags: freeze(assessmentFlags),
      provenanceSufficient: sourceEndpointProvenance && targetEndpointProvenance &&
        apply(arrayEvery, evidence, [item => item.provenanceSufficient])
    });
  }

  function evaluateCorrelationEligibility(contract, view, context, rde, input, policy) {
    const digest = authenticateContext(contract, view, context, rde);
    const frozenPolicy = validatePolicy(contract, policy);
    if (!isPlainObject(input) || !arrayIsArray(input.candidates)) {
      fail('correlation candidate list is required');
    }
    const policyDigest = hashCanonical(frozenPolicy);
    const presentation = copyFrozen(getPresentationIdentity(context), []);
    const candidates = apply(arrayMap, input.candidates, [candidate =>
      validateCandidate(contract, view, candidate, frozenPolicy, policyDigest, digest, presentation)]);
    const ordered = apply(arraySort, apply(arraySlice, candidates, []), [(left, right) => right.score - left.score]);
    const top = ordered.length ? ordered[0] : null;
    const ambiguous = candidates.length > 1;
    const conflict = apply(arraySome, candidates, [candidate => candidate.conflictFlags.length > 0 ||
      candidate.conflictAssessment.outcome === 'MATERIAL_CONFLICT']);
    const insufficientConflictAssessment = apply(arraySome, candidates, [candidate => !candidate.conflictAssessmentUsable ||
      candidate.conflictAssessment.outcome === 'INDETERMINATE']);
    const insufficientProvenance = apply(arraySome, candidates, [candidate => !candidate.provenanceSufficient]);
    const expectedPairs = expectedCandidatePairs(contract, view, frozenPolicy);
    let completeCandidateSet = expectedPairs.length === candidates.length;
    for (let expectedIndex = 0; expectedIndex < expectedPairs.length; expectedIndex += 1) {
      let matches = 0;
      for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
        const candidatePairMatches = makeReferenceKey(candidates[candidateIndex].drtSource) ===
          makeReferenceKey(expectedPairs[expectedIndex].drtSource) &&
          makeReferenceKey(candidates[candidateIndex].technicalProductTarget) ===
          makeReferenceKey(expectedPairs[expectedIndex].technicalProductTarget);
        if (candidatePairMatches) matches += 1;
      }
      if (matches !== 1) completeCandidateSet = false;
    }
    const insufficientCandidateSet = !top || !completeCandidateSet;
    const eligible = !ambiguous && !conflict && !insufficientConflictAssessment &&
      !insufficientCandidateSet && !insufficientProvenance && top.score >= frozenPolicy.threshold;
    const flags = [];
    if (ambiguous) append(flags, 'COMPETING_CANDIDATES');
    if (conflict) append(flags, 'MATERIAL_CONFLICT');
    if (insufficientConflictAssessment) append(flags, 'CONFLICT_ASSESSMENT_INSUFFICIENT');
    if (insufficientProvenance) append(flags, 'INSUFFICIENT_PROVENANCE');
    if (insufficientCandidateSet) append(flags, 'INCOMPLETE_CANDIDATE_SET');
    if (top && top.score < frozenPolicy.threshold) append(flags, 'BELOW_THRESHOLD');
    return freeze({
      eligibility: eligible ? 'SCORE_AND_CANDIDATE_GATES_PASSED' : 'HUMAN_REVIEW_REQUIRED',
      threshold: frozenPolicy.threshold,
      candidate: candidates.length === 1 && completeCandidateSet ? top : null,
      candidates: freeze(candidates),
      flags: freeze(flags)
    });
  }

  function makeCorrelationDecision(contract, view, context, rde, input, policy) {
    const digest = authenticateContext(contract, view, context, rde);
    const policySnapshot = validatePolicy(contract, policy);
    const eligibility = evaluateCorrelationEligibility(contract, view, context, rde, input, policySnapshot);
    const policyDigest = hashCanonical(policySnapshot);
    const authenticatedConfiguration = typeof loadAuthenticatedConfiguration === 'function'
      ? loadAuthenticatedConfiguration() : null;
    const configurationEntry = getAuthenticatedConfigurationEntry(
      authenticatedConfiguration, policySnapshot.baseId, policySnapshot.bindingType
    );
    const configuredPolicyMatches = !!configurationEntry &&
      canonicalJson(configurationEntry.policy) === canonicalJson(policySnapshot);
    const calibration = configuredPolicyMatches
      ? applicableCalibration(policySnapshot, policyDigest, configurationEntry.calibrations)
      : null;
    const admitted = configuredPolicyMatches && !!calibration &&
      eligibility.eligibility === 'SCORE_AND_CANDIDATE_GATES_PASSED';
    const evidence = [];
    for (let proposalIndex = 0; proposalIndex < eligibility.candidates.length; proposalIndex += 1) {
      const proposal = eligibility.candidates[proposalIndex];
      for (let evidenceIndex = 0; evidenceIndex < proposal.evidence.length; evidenceIndex += 1) {
        append(evidence, proposal.evidence[evidenceIndex]);
      }
    }
    const artifactPayload = {
      kind: 'INFERRED_DRT_PRODUCT_CORRELATION',
      status: admitted ? 'ADMITTED' : 'HUMAN_REVIEW',
      reason: admitted ? 'authenticated policy, empirical calibration and candidate gates passed'
        : eligibility.eligibility === 'HUMAN_REVIEW_REQUIRED'
          ? 'candidate gates require human review'
          : !configuredPolicyMatches
            ? 'authenticated policy configuration is unavailable; human review is required'
            : 'calibration gate is blocked; human confirmation is required',
      base_id: policySnapshot.baseId,
      binding_type: policySnapshot.bindingType,
      rdeDigest: digest,
      rde_schema_version: rde.schema_version,
      presentation: copyFrozen(getPresentationIdentity(context), []),
      policy: policySnapshot,
      policyDigest,
      configurationVersion: configuredPolicyMatches ? configurationEntry.configurationVersion : null,
      configurationSignature: configuredPolicyMatches ? configurationEntry.configurationSignature : null,
      threshold: policySnapshot.threshold,
      calibration: calibration || freeze({
        status: 'BLOCKED', calibrationId: null, baseId: policySnapshot.baseId,
        bindingType: policySnapshot.bindingType, version: null, datasetHash: null,
        validity: configuredPolicyMatches ? 'NO_APPROVED_EMPIRICAL_CALIBRATION' :
          'NO_AUTHENTICATED_CORRELATION_CONFIGURATION'
      }),
      gates: freeze({
        policy: configuredPolicyMatches ? 'VALID_FOR_BASE_AND_BINDING_TYPE' : 'BLOCKED_UNAUTHENTICATED_CONFIGURATION',
        candidateEligibility: eligibility.eligibility,
        calibration: calibration ? 'VALID' : 'BLOCKED', humanReview: admitted ? 'NOT_REQUIRED' : 'REQUIRED'
      }),
      decision: admitted
        ? freeze({ outcome: 'ADMITTED', candidateId: eligibility.candidate.candidateId,
          score: eligibility.candidate.score, relation: eligibility.candidate })
        : freeze({ outcome: 'HUMAN_REVIEW', candidateId: null, score: null, relation: null }),
      proposals: eligibility.candidates,
      evidence: freeze(evidence),
      flags: eligibility.flags,
      normativeResult: null
    };
    const decisionId = hashCanonical(artifactPayload);
    const completePayload = { ...artifactPayload, decision_id: decisionId };
    const integrityDigest = hashCanonical(completePayload);
    const artifact = freeze({ ...completePayload, integrityDigest });
    apply(weakMapSet, decisions, [artifact, freeze({ contract, view, context, rde, digest, policyDigest })]);
    return artifact;
  }

  function isAuthenticatedCorrelationDecision(decision, contract, view, context, rde) {
    const binding = apply(weakMapGet, decisions, [decision]);
    if (!binding || binding.contract !== contract || binding.view !== view ||
        binding.context !== context || binding.rde !== rde || !isFrozen(decision) ||
        !isCanonicalRdeDigest(rde, binding.digest) ||
        !isViewDerivedFromRde(view, rde, binding.digest)) return false;
    if (decision.rdeDigest !== binding.digest || decision.policyDigest !== binding.policyDigest ||
        !decision.integrityDigest ||
        (decision.policy === null || hashCanonical(decision.policy) !== binding.policyDigest)) return false;
    const payload = objectCreate(null);
    const decisionKeys = objectKeys(decision);
    for (let keyIndex = 0; keyIndex < decisionKeys.length; keyIndex += 1) {
      const key = decisionKeys[keyIndex];
      if (key !== 'integrityDigest') defineProperty(payload, key, { value: decision[key], enumerable: true });
    }
    return hashCanonical(payload) === decision.integrityDigest;
  }

  function readOnlyCorrelationForEngine(decision, contract, plan, view, context, rde) {
    if (!isAuthenticatedCorrelationDecision(decision, contract, view, context, rde)) {
      fail('correlation decision is unauthenticated or bound to another presentation/RDE');
    }
    authenticatePlan(contract, plan, view, context);
    const admitted = decision.status === 'ADMITTED' && decision.decision &&
      decision.decision.outcome === 'ADMITTED' && decision.decision.relation;
    return freeze({
      relation: admitted ? copyFrozen(decision.decision.relation, []) : null,
      status: decision.status,
      confidence: admitted ? decision.decision.score : null,
      decisionId: decision.decision_id,
      rdeDigest: decision.rdeDigest,
      policyVersion: decision.policy.version,
      calibrationId: decision.calibration.calibrationId || null,
      calibrationVersion: decision.calibration.version,
      calibrationDatasetHash: decision.calibration.datasetHash,
      normativeResult: null
    });
  }

  Object.defineProperties(global, {
    CorrelationContractError: { value: CorrelationContractError, enumerable: true, writable: false, configurable: false },
    evaluateCorrelationEligibility: { value: evaluateCorrelationEligibility, enumerable: true, writable: false, configurable: false },
    makeCorrelationDecision: { value: makeCorrelationDecision, enumerable: true, writable: false, configurable: false },
    isAuthenticatedCorrelationDecision: { value: isAuthenticatedCorrelationDecision, enumerable: true, writable: false, configurable: false },
    readOnlyCorrelationForEngine: { value: readOnlyCorrelationForEngine, enumerable: true, writable: false, configurable: false },
    canonicalCorrelationJson: { value: canonicalJson, enumerable: false, writable: false, configurable: false },
    hashCanonicalCorrelation: { value: hashCanonical, enumerable: false, writable: false, configurable: false }
  });
})(globalThis);
