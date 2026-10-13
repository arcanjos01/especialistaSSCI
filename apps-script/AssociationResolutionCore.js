(function (global) {
'use strict';
/** Automatic DRT ↔ technical-product correlation. This artifact never edits an RDE. */

class AssociationResolutionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AssociationResolutionError';
    this.code = code;
  }
}

const ASSOCIATION_ARTIFACTS_ = new WeakMap();
const ASSOCIATION_APPLY_ = Reflect.apply;
const ASSOCIATION_WEAKMAP_GET_ = WeakMap.prototype.get;
const ASSOCIATION_WEAKMAP_SET_ = WeakMap.prototype.set;
const ASSOCIATION_FREEZE_ = Object.freeze;
const ASSOCIATION_IS_ARRAY_ = Array.isArray;
const ASSOCIATION_KEYS_ = Object.keys;
const ASSOCIATION_DEFINE_ = Object.defineProperty;
const ASSOCIATION_MAP_ = Map;
const ASSOCIATION_MAP_GET_ = Map.prototype.get;
const ASSOCIATION_MAP_SET_ = Map.prototype.set;
const ASSOCIATION_MAP_FOR_EACH_ = Map.prototype.forEach;
const ASSOCIATION_SET_ = Set;
const ASSOCIATION_SET_HAS_ = Set.prototype.has;
const ASSOCIATION_SET_ADD_ = Set.prototype.add;
const ASSOCIATION_ARRAY_FOR_EACH_ = Array.prototype.forEach;
const ASSOCIATION_ARRAY_EVERY_ = Array.prototype.every;
const ASSOCIATION_ARRAY_CONCAT_ = Array.prototype.concat;
const ASSOCIATION_ARRAY_SLICE_ = Array.prototype.slice;
const ASSOCIATION_ARRAY_SORT_ = Array.prototype.sort;
const ASSOCIATION_ARRAY_PUSH_ = Array.prototype.push;
const ASSOCIATION_ARRAY_SOME_ = Array.prototype.some;
const ASSOCIATION_NUMBER_IS_FINITE_ = Number.isFinite;
const ASSOCIATION_NUMBER_IS_INTEGER_ = Number.isInteger;
const ASSOCIATION_JSON_STRINGIFY_ = JSON.stringify;
const ASSOCIATION_REGEXP_TEST_ = RegExp.prototype.test;
const ASSOCIATION_STRING_TRIM_ = String.prototype.trim;
const ASSOCIATION_DATE_TO_ISO_ = Date.prototype.toISOString;

function associationApply_(method, receiver, args) {
  return ASSOCIATION_APPLY_(method, receiver, args);
}
function associationForEach_(array, callback) {
  return associationApply_(ASSOCIATION_ARRAY_FOR_EACH_, array, [callback]);
}
function associationEvery_(array, callback) {
  return associationApply_(ASSOCIATION_ARRAY_EVERY_, array, [callback]);
}
function associationSliceSort_(array) {
  return associationApply_(ASSOCIATION_ARRAY_SORT_,
    associationApply_(ASSOCIATION_ARRAY_SLICE_, array, []), []);
}
function associationMapGet_(map, key) { return associationApply_(ASSOCIATION_MAP_GET_, map, [key]); }
function associationMapSet_(map, key, value) {
  return associationApply_(ASSOCIATION_MAP_SET_, map, [key, value]);
}
function associationMapForEach_(map, callback) {
  return associationApply_(ASSOCIATION_MAP_FOR_EACH_, map, [callback]);
}
function associationSetHas_(set, value) { return associationApply_(ASSOCIATION_SET_HAS_, set, [value]); }
function associationSetAdd_(set, value) { return associationApply_(ASSOCIATION_SET_ADD_, set, [value]); }
function associationJson_(value) { return associationApply_(ASSOCIATION_JSON_STRINGIFY_, JSON, [value]); }
function associationRegexTest_(regex, value) {
  return associationApply_(ASSOCIATION_REGEXP_TEST_, regex, [value]);
}
function associationTrim_(value) { return associationApply_(ASSOCIATION_STRING_TRIM_, value, []); }
function associationSome_(array, callback) {
  return associationApply_(ASSOCIATION_ARRAY_SOME_, array, [callback]);
}

function associationRequire_(condition, code, message) {
  if (!condition) throw new AssociationResolutionError(code, message);
}

function associationCloneFreeze_(value) {
  if (ASSOCIATION_IS_ARRAY_(value)) {
    const copy = [];
    associationForEach_(value, item => associationApply_(ASSOCIATION_ARRAY_PUSH_, copy,
      [associationCloneFreeze_(item)]));
    return associationApply_(ASSOCIATION_FREEZE_, Object, [copy]);
  }
  if (value && typeof value === 'object') {
    const copy = {};
    associationForEach_(associationSliceSort_(ASSOCIATION_KEYS_(value)), key => {
      ASSOCIATION_DEFINE_(copy, key, {
        value: associationCloneFreeze_(value[key]), enumerable: true,
        writable: false, configurable: false
      });
    });
    return associationApply_(ASSOCIATION_FREEZE_, Object, [copy]);
  }
  return value;
}

function associationPolicyIsUsable_(policy, baseId, relationType) {
  if (!policy || policy.status !== 'ACTIVE' || typeof policy.version !== 'string' ||
      !associationTrim_(policy.version) || policy.baseId !== baseId ||
      policy.relationType !== relationType || !policy.calibration ||
      policy.calibration.status !== 'VALIDATED' ||
      policy.calibration.baseId !== baseId ||
      policy.calibration.relationType !== relationType ||
      typeof policy.calibration.threshold !== 'number' ||
      !ASSOCIATION_NUMBER_IS_FINITE_(policy.calibration.threshold) ||
      policy.calibration.threshold < 0 || policy.calibration.threshold > 1 ||
      !ASSOCIATION_NUMBER_IS_INTEGER_(policy.calibration.sampleSize) || policy.calibration.sampleSize < 1 ||
      !ASSOCIATION_NUMBER_IS_INTEGER_(policy.calibration.minimumSampleSize) ||
      policy.calibration.minimumSampleSize < 1 ||
      policy.calibration.sampleSize < policy.calibration.minimumSampleSize ||
      typeof policy.calibration.falseAcceptanceRate !== 'number' ||
      !ASSOCIATION_NUMBER_IS_FINITE_(policy.calibration.falseAcceptanceRate) ||
      policy.calibration.falseAcceptanceRate < 0 || policy.calibration.falseAcceptanceRate > 1 ||
      typeof policy.calibration.maxFalseAcceptanceRate !== 'number' ||
      !ASSOCIATION_NUMBER_IS_FINITE_(policy.calibration.maxFalseAcceptanceRate) ||
      policy.calibration.maxFalseAcceptanceRate < 0 || policy.calibration.maxFalseAcceptanceRate > 1 ||
      policy.calibration.falseAcceptanceRate > policy.calibration.maxFalseAcceptanceRate ||
      typeof policy.calibration.version !== 'string' || !associationTrim_(policy.calibration.version) ||
      typeof policy.calibration.modelVersion !== 'string' || !associationTrim_(policy.calibration.modelVersion) ||
      typeof policy.calibration.datasetDigest !== 'string' ||
      !associationRegexTest_(/^sha256:[a-f0-9]{64}$/i, policy.calibration.datasetDigest) ||
      typeof policy.policyDigest !== 'string' ||
      !associationRegexTest_(/^sha256:[a-f0-9]{64}$/i, policy.policyDigest) ||
      typeof policy.calibration.scoringModelDigest !== 'string' ||
      !associationRegexTest_(/^sha256:[a-f0-9]{64}$/i, policy.calibration.scoringModelDigest) ||
      typeof policy.calibration.approvedBy !== 'string' || !associationTrim_(policy.calibration.approvedBy) ||
      typeof policy.calibration.validatedAt !== 'string' || !associationTrim_(policy.calibration.validatedAt)) {
    return false;
  }
  const gates = policy.controls;
  return !!gates && gates.provenanceVerified === true &&
    gates.noConflict === true && gates.noAmbiguity === true &&
    gates.contextBound === true && gates.auditEnabled === true &&
    gates.reportDisclosureEnabled === true;
}

function resolveAutomaticAssociations(input) {
  associationRequire_(input && typeof input === 'object', 'INPUT_INVALID', 'input is required');
  associationRequire_(typeof global.isImmutableExecutionView === 'function' &&
    global.isImmutableExecutionView(input.view), 'EXECUTION_VIEW_REQUIRED',
  'association decisions must bind to the exact canonical execution view for this RDE');
  associationRequire_(typeof global.isCanonicalCompiledRuntimeContract === 'function' &&
    global.isCanonicalCompiledRuntimeContract(input.contract) &&
    typeof global.isCanonicalCbmscApplicabilityResolution === 'function' &&
    global.isCanonicalCbmscApplicabilityResolution(input.resolution, input.view, input.contract),
  'CANONICAL_EXECUTION_CONTEXT_REQUIRED',
  'association decisions must bind to the canonical contract and selected presentation');
  associationRequire_(typeof input.submissionId === 'string' && associationTrim_(input.submissionId),
    'SUBMISSION_REQUIRED', 'exact submission identifier is required');
  associationRequire_(typeof input.baseId === 'string' && associationTrim_(input.baseId),
    'BASE_REQUIRED', 'Base identifier is required');
  associationRequire_(input.baseId === input.contract.knowledgeBase.id,
    'BASE_CONTEXT_MISMATCH', 'Base identifier must match the active canonical Knowledge Base');
  associationRequire_(typeof input.rdeDigest === 'string' &&
    associationRegexTest_(/^sha256:[a-f0-9]{64}$/i, input.rdeDigest),
  'RDE_DIGEST_REQUIRED', 'SHA-256 digest of the validated RDE is required');
  associationRequire_(ASSOCIATION_IS_ARRAY_(input.candidates), 'CANDIDATES_INVALID',
    'candidate associations must be an array');
  associationRequire_(typeof input.verifyEvidenceRef === 'function',
    'EVIDENCE_VERIFIER_REQUIRED', 'evidence references must be verified against the exact RDE context');
  associationRequire_(typeof input.verifyPolicy === 'function' &&
    typeof input.hasHumanRejection === 'function' &&
    typeof input.verifyCandidate === 'function' &&
    typeof input.verifySubmissionContext === 'function', 'GOVERNANCE_VERIFIERS_REQUIRED',
  'submission, policy, model-output and human-rejection ledger verifiers are required');
  let submissionContextVerified = false;
  try {
    submissionContextVerified = input.verifySubmissionContext(input.submissionId, {
      baseId: input.baseId, rdeDigest: input.rdeDigest, view: input.view,
      resolution: input.resolution, contract: input.contract,
    }) === true;
  } catch (error) {
    submissionContextVerified = false;
  }
  associationRequire_(submissionContextVerified, 'SUBMISSION_CONTEXT_UNVERIFIED',
    'submission identifier does not match the exact selected presentation context');

  const candidateIds = new ASSOCIATION_SET_();
  const sourceGroups = new ASSOCIATION_MAP_();
  associationForEach_(input.candidates, candidate => {
    associationRequire_(candidate && typeof candidate.candidateId === 'string' &&
      associationTrim_(candidate.candidateId) && !associationSetHas_(candidateIds, candidate.candidateId),
    'CANDIDATE_INVALID', 'candidate identifiers must be present and unique');
    associationSetAdd_(candidateIds, candidate.candidateId);
    if (!ASSOCIATION_IS_ARRAY_(candidate.sourceEvidenceRefs) ||
        !associationEvery_(candidate.sourceEvidenceRefs, ref => typeof ref === 'string' && associationTrim_(ref))) return;
    const groupKey = associationJson_([
      candidate.relationType,
      associationSliceSort_(candidate.sourceEvidenceRefs),
      ASSOCIATION_IS_ARRAY_(candidate.targetEvidenceRefs)
        ? associationSliceSort_(candidate.targetEvidenceRefs) : [],
    ]);
    let group = associationMapGet_(sourceGroups, groupKey);
    if (!group) {
      group = [];
      associationMapSet_(sourceGroups, groupKey, group);
    }
    associationApply_(ASSOCIATION_ARRAY_PUSH_, group, [candidate.candidateId]);
  });
  const ambiguousCandidateIds = new ASSOCIATION_SET_();
  associationMapForEach_(sourceGroups, group => {
    if (group.length > 1) associationForEach_(group, candidateId =>
      associationSetAdd_(ambiguousCandidateIds, candidateId));
  });

  const decisions = [];
  associationForEach_(input.candidates, candidate => {
    associationRequire_(candidate && typeof candidate === 'object' &&
      typeof candidate.candidateId === 'string' && associationTrim_(candidate.candidateId),
    'CANDIDATE_INVALID', 'candidate identifier is required');
    const relationType = candidate.relationType;
    associationRequire_(typeof relationType === 'string' &&
      associationRegexTest_(/^[A-Z][A-Z0-9_]{2,63}$/, relationType),
    'RELATION_TYPE_UNSUPPORTED', 'relation type must be a registered identifier');
    const policy = input.policies && input.policies[relationType];
    const policyShapeValid = associationPolicyIsUsable_(policy, input.baseId, relationType);
    let policyAuthentic = false;
    if (policyShapeValid) {
      try {
        policyAuthentic = input.verifyPolicy(policy, {
          baseId: input.baseId, relationType, submissionId: input.submissionId,
          rdeDigest: input.rdeDigest, view: input.view,
          resolution: input.resolution, contract: input.contract,
        }) === true;
      } catch (error) {
        policyAuthentic = false;
      }
    }
    const policyUsable = policyShapeValid && policyAuthentic;
    const candidateRefsValid = ASSOCIATION_IS_ARRAY_(candidate.sourceEvidenceRefs) &&
      candidate.sourceEvidenceRefs.length > 0 &&
      associationEvery_(candidate.sourceEvidenceRefs, ref => typeof ref === 'string' && associationTrim_(ref)) &&
      ASSOCIATION_IS_ARRAY_(candidate.targetEvidenceRefs) && candidate.targetEvidenceRefs.length > 0 &&
      associationEvery_(candidate.targetEvidenceRefs, ref => typeof ref === 'string' && associationTrim_(ref));
    const associationKey = candidateRefsValid
      ? associationJson_([relationType, associationSliceSort_(candidate.sourceEvidenceRefs),
        associationSliceSort_(candidate.targetEvidenceRefs)]) : null;
    let rejected = false;
    let rejectionCheckFailed = false;
    if (associationKey) {
      try {
        const rejectionStatus = input.hasHumanRejection(associationKey, {
          submissionId: input.submissionId, baseId: input.baseId, rdeDigest: input.rdeDigest,
          view: input.view, resolution: input.resolution, contract: input.contract,
        });
        if (rejectionStatus === true) rejected = true;
        else if (rejectionStatus !== false) rejectionCheckFailed = true;
      } catch (error) {
        rejectionCheckFailed = true;
      }
    }
    const allEvidenceRefs = candidateRefsValid
      ? associationApply_(ASSOCIATION_ARRAY_CONCAT_, candidate.sourceEvidenceRefs,
        [candidate.targetEvidenceRefs]) : [];
    const provenanceValid = candidateRefsValid && candidate.provenanceVerified === true &&
      associationEvery_(allEvidenceRefs, ref => {
        try {
          return input.verifyEvidenceRef(ref, {
            submissionId: input.submissionId,
            baseId: input.baseId,
            rdeDigest: input.rdeDigest,
            view: input.view, resolution: input.resolution, contract: input.contract,
            candidateId: candidate.candidateId,
            relationType,
          }) === true;
        } catch (error) {
          return false;
        }
      });
    const scoreValid = typeof candidate.score === 'number' &&
      ASSOCIATION_NUMBER_IS_FINITE_(candidate.score) && candidate.score >= 0 && candidate.score <= 1;
    let modelOutputVerified = false;
    try {
      modelOutputVerified = input.verifyCandidate(candidate, {
        submissionId: input.submissionId, baseId: input.baseId,
        rdeDigest: input.rdeDigest, view: input.view, relationType,
        resolution: input.resolution, contract: input.contract,
        candidateSet: input.candidates,
      }) === true;
    } catch (error) {
      modelOutputVerified = false;
    }
    const modelVersionValid = typeof candidate.modelVersion === 'string' &&
      policyUsable && candidate.modelVersion === policy.calibration.modelVersion;
    const unambiguous = !associationSetHas_(ambiguousCandidateIds, candidate.candidateId) &&
      candidate.competingCandidateCount === 0 && candidate.conflicted === false;
    const passes = !rejected && !rejectionCheckFailed && policyUsable && candidateRefsValid && scoreValid &&
      modelVersionValid && modelOutputVerified && provenanceValid && unambiguous &&
      candidate.score >= policy.calibration.threshold;
    const reasons = [];
    if (rejected) reasons.push('HUMAN_REJECTION_PRECEDENCE');
    if (rejectionCheckFailed) reasons.push('HUMAN_REJECTION_CHECK_FAILED');
    if (!policyUsable) reasons.push('CALIBRATED_BASE_POLICY_UNAVAILABLE');
    if (!candidateRefsValid) reasons.push('EVIDENCE_REFERENCES_INVALID');
    if (!scoreValid || (scoreValid && policyUsable && candidate.score < policy.calibration.threshold)) {
      reasons.push('BELOW_CALIBRATED_THRESHOLD');
    }
    if (!provenanceValid) reasons.push('PROVENANCE_UNVERIFIED');
    if (!modelVersionValid) reasons.push('MODEL_VERSION_UNCALIBRATED');
    if (!modelOutputVerified) reasons.push('MODEL_OUTPUT_UNVERIFIED');
    if (!unambiguous) reasons.push('CONFLICT_OR_AMBIGUITY');
    associationApply_(ASSOCIATION_ARRAY_PUSH_, decisions, [{
      candidateId: candidate.candidateId,
      associationKey,
      relationType,
      sourceEvidenceRefs: candidateRefsValid ? candidate.sourceEvidenceRefs : [],
      targetEvidenceRefs: candidateRefsValid ? candidate.targetEvidenceRefs : [],
      score: scoreValid ? candidate.score : null,
      modelVersion: modelVersionValid ? candidate.modelVersion : null,
      decision: passes ? 'AUTO_ACCEPTED' : 'NOT_ADMITTED',
      reasonCodes: reasons,
      policyVersion: policyUsable ? policy.version : null,
      policyDigest: policyUsable ? policy.policyDigest : null,
      calibrationVersion: policyUsable ? policy.calibration.version : null,
      calibration: policyUsable ? {
        threshold: policy.calibration.threshold,
        sampleSize: policy.calibration.sampleSize,
        minimumSampleSize: policy.calibration.minimumSampleSize,
        falseAcceptanceRate: policy.calibration.falseAcceptanceRate,
        maxFalseAcceptanceRate: policy.calibration.maxFalseAcceptanceRate,
        datasetDigest: policy.calibration.datasetDigest,
        scoringModelDigest: policy.calibration.scoringModelDigest,
        approvedBy: policy.calibration.approvedBy,
        validatedAt: policy.calibration.validatedAt,
      } : null,
    }]);
  });

  const artifact = associationCloneFreeze_({
    artifactType: 'AUTOMATIC_ASSOCIATION_DECISIONS',
    artifactVersion: 1,
    mode: 'ACTIVE_FAIL_CLOSED',
    submissionId: input.submissionId,
    baseId: input.baseId,
    selectedPresentation: {
      kind: input.resolution.selectedComprovante.kind,
      identifier: input.resolution.selectedComprovante.identifier,
    },
    rdeDigest: input.rdeDigest,
    normativeValidation: 'PENDING_INSTITUTIONAL_VALIDATION',
    decidedAt: associationApply_(ASSOCIATION_DATE_TO_ISO_, new Date(), []),
    decisions,
    reportNotice: associationSome_(decisions, item => item.decision === 'AUTO_ACCEPTED')
      ? 'Vínculo DRT–produto técnico admitido automaticamente pelo sistema, conforme política calibrada da Base. A validação normativa institucional desta regra permanece pendente; ciência do vistoriador necessária.'
      : null,
  });
  associationApply_(ASSOCIATION_WEAKMAP_SET_, ASSOCIATION_ARTIFACTS_, [artifact, {
    view: input.view,
    resolution: input.resolution,
    contract: input.contract,
    submissionId: input.submissionId,
    baseId: input.baseId,
    rdeDigest: input.rdeDigest,
  }]);
  return artifact;
}

function isCanonicalAutomaticAssociationArtifact(artifact, expected, view, resolution, contract) {
  const binding = artifact && associationApply_(ASSOCIATION_WEAKMAP_GET_,
    ASSOCIATION_ARTIFACTS_, [artifact]);
  return !!binding && artifact.artifactType === 'AUTOMATIC_ASSOCIATION_DECISIONS' &&
    artifact.artifactVersion === 1 && artifact.mode === 'ACTIVE_FAIL_CLOSED' &&
    binding.view === view && binding.resolution === resolution && binding.contract === contract &&
    (!expected || (binding.submissionId === expected.submissionId &&
      binding.baseId === expected.baseId && binding.rdeDigest === expected.rdeDigest));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AssociationResolutionError,
    resolveAutomaticAssociations,
    isCanonicalAutomaticAssociationArtifact,
  };
}
Object.defineProperty(global, 'resolveAutomaticAssociations', {
  value: resolveAutomaticAssociations, enumerable: true, writable: false, configurable: false
});
Object.defineProperty(global, 'isCanonicalAutomaticAssociationArtifact', {
  value: isCanonicalAutomaticAssociationArtifact, enumerable: false,
  writable: false, configurable: false
});
})(globalThis);
