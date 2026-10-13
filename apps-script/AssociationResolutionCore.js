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

function associationRequire_(condition, code, message) {
  if (!condition) throw new AssociationResolutionError(code, message);
}

function associationCloneFreeze_(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(associationCloneFreeze_));
  if (value && typeof value === 'object') {
    const copy = {};
    Object.keys(value).sort().forEach(key => {
      Object.defineProperty(copy, key, {
        value: associationCloneFreeze_(value[key]), enumerable: true,
        writable: false, configurable: false
      });
    });
    return Object.freeze(copy);
  }
  return value;
}

function associationPolicyIsUsable_(policy, baseId, relationType) {
  if (!policy || policy.status !== 'ACTIVE' || typeof policy.version !== 'string' ||
      !policy.version.trim() || policy.baseId !== baseId ||
      policy.relationType !== relationType || !policy.calibration ||
      policy.calibration.status !== 'VALIDATED' ||
      policy.calibration.baseId !== baseId ||
      policy.calibration.relationType !== relationType ||
      typeof policy.calibration.threshold !== 'number' ||
      !Number.isFinite(policy.calibration.threshold) ||
      policy.calibration.threshold < 0 || policy.calibration.threshold > 1 ||
      !Number.isInteger(policy.calibration.sampleSize) || policy.calibration.sampleSize < 1 ||
      !Number.isInteger(policy.calibration.minimumSampleSize) ||
      policy.calibration.minimumSampleSize < 1 ||
      policy.calibration.sampleSize < policy.calibration.minimumSampleSize ||
      typeof policy.calibration.falseAcceptanceRate !== 'number' ||
      !Number.isFinite(policy.calibration.falseAcceptanceRate) ||
      policy.calibration.falseAcceptanceRate < 0 || policy.calibration.falseAcceptanceRate > 1 ||
      typeof policy.calibration.maxFalseAcceptanceRate !== 'number' ||
      !Number.isFinite(policy.calibration.maxFalseAcceptanceRate) ||
      policy.calibration.maxFalseAcceptanceRate < 0 || policy.calibration.maxFalseAcceptanceRate > 1 ||
      policy.calibration.falseAcceptanceRate > policy.calibration.maxFalseAcceptanceRate ||
      typeof policy.calibration.version !== 'string' || !policy.calibration.version.trim() ||
      typeof policy.calibration.modelVersion !== 'string' || !policy.calibration.modelVersion.trim() ||
      typeof policy.calibration.datasetDigest !== 'string' ||
      !/^sha256:[a-f0-9]{64}$/i.test(policy.calibration.datasetDigest) ||
      typeof policy.policyDigest !== 'string' || !/^sha256:[a-f0-9]{64}$/i.test(policy.policyDigest) ||
      typeof policy.calibration.scoringModelDigest !== 'string' ||
      !/^sha256:[a-f0-9]{64}$/i.test(policy.calibration.scoringModelDigest) ||
      typeof policy.calibration.approvedBy !== 'string' || !policy.calibration.approvedBy.trim() ||
      typeof policy.calibration.validatedAt !== 'string' || !policy.calibration.validatedAt.trim()) {
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
  associationRequire_(typeof input.submissionId === 'string' && input.submissionId.trim(),
    'SUBMISSION_REQUIRED', 'exact submission identifier is required');
  associationRequire_(typeof input.baseId === 'string' && input.baseId.trim(),
    'BASE_REQUIRED', 'Base identifier is required');
  associationRequire_(input.baseId === input.contract.knowledgeBase.id,
    'BASE_CONTEXT_MISMATCH', 'Base identifier must match the active canonical Knowledge Base');
  associationRequire_(typeof input.rdeDigest === 'string' &&
    /^sha256:[a-f0-9]{64}$/i.test(input.rdeDigest),
  'RDE_DIGEST_REQUIRED', 'SHA-256 digest of the validated RDE is required');
  associationRequire_(Array.isArray(input.candidates), 'CANDIDATES_INVALID',
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

  const candidateIds = new Set();
  const sourceGroups = new Map();
  input.candidates.forEach(candidate => {
    associationRequire_(candidate && typeof candidate.candidateId === 'string' &&
      candidate.candidateId.trim() && !candidateIds.has(candidate.candidateId),
    'CANDIDATE_INVALID', 'candidate identifiers must be present and unique');
    candidateIds.add(candidate.candidateId);
    if (!Array.isArray(candidate.sourceEvidenceRefs) ||
        !candidate.sourceEvidenceRefs.every(ref => typeof ref === 'string' && ref.trim())) return;
    const groupKey = JSON.stringify([
      candidate.relationType,
      candidate.sourceEvidenceRefs.slice().sort(),
      Array.isArray(candidate.targetEvidenceRefs) ? candidate.targetEvidenceRefs.slice().sort() : [],
    ]);
    if (!sourceGroups.has(groupKey)) sourceGroups.set(groupKey, []);
    sourceGroups.get(groupKey).push(candidate.candidateId);
  });
  const ambiguousCandidateIds = new Set();
  sourceGroups.forEach(group => {
    if (group.length > 1) group.forEach(candidateId => ambiguousCandidateIds.add(candidateId));
  });

  const decisions = input.candidates.map(candidate => {
    associationRequire_(candidate && typeof candidate === 'object' &&
      typeof candidate.candidateId === 'string' && candidate.candidateId.trim(),
    'CANDIDATE_INVALID', 'candidate identifier is required');
    const relationType = candidate.relationType;
    associationRequire_(typeof relationType === 'string' &&
      /^[A-Z][A-Z0-9_]{2,63}$/.test(relationType),
    'RELATION_TYPE_UNSUPPORTED', 'relation type must be a registered identifier');
    const policy = input.policies && input.policies[relationType];
    const policyShapeValid = associationPolicyIsUsable_(policy, input.baseId, relationType);
    let policyAuthentic = false;
    if (policyShapeValid) {
      try {
        policyAuthentic = input.verifyPolicy(policy, {
          baseId: input.baseId, relationType, submissionId: input.submissionId,
        }) === true;
      } catch (error) {
        policyAuthentic = false;
      }
    }
    const policyUsable = policyShapeValid && policyAuthentic;
    const candidateRefsValid = Array.isArray(candidate.sourceEvidenceRefs) &&
      candidate.sourceEvidenceRefs.length > 0 &&
      candidate.sourceEvidenceRefs.every(ref => typeof ref === 'string' && ref.trim()) &&
      Array.isArray(candidate.targetEvidenceRefs) && candidate.targetEvidenceRefs.length > 0 &&
      candidate.targetEvidenceRefs.every(ref => typeof ref === 'string' && ref.trim());
    const associationKey = candidateRefsValid
      ? JSON.stringify([relationType, candidate.sourceEvidenceRefs.slice().sort(),
        candidate.targetEvidenceRefs.slice().sort()]) : null;
    let rejected = false;
    let rejectionCheckFailed = false;
    if (associationKey) {
      try {
        const rejectionStatus = input.hasHumanRejection(associationKey, {
          submissionId: input.submissionId, baseId: input.baseId, rdeDigest: input.rdeDigest,
        });
        if (rejectionStatus === true) rejected = true;
        else if (rejectionStatus !== false) rejectionCheckFailed = true;
      } catch (error) {
        rejectionCheckFailed = true;
      }
    }
    const provenanceValid = candidateRefsValid && candidate.provenanceVerified === true &&
      candidate.sourceEvidenceRefs.concat(candidate.targetEvidenceRefs).every(ref => {
        try {
          return input.verifyEvidenceRef(ref, {
            submissionId: input.submissionId,
            baseId: input.baseId,
            rdeDigest: input.rdeDigest,
            candidateId: candidate.candidateId,
            relationType,
          }) === true;
        } catch (error) {
          return false;
        }
      });
    const scoreValid = typeof candidate.score === 'number' &&
      Number.isFinite(candidate.score) && candidate.score >= 0 && candidate.score <= 1;
    let modelOutputVerified = false;
    try {
      modelOutputVerified = input.verifyCandidate(candidate, {
        submissionId: input.submissionId, baseId: input.baseId,
        rdeDigest: input.rdeDigest, view: input.view, relationType,
        candidateSet: input.candidates,
      }) === true;
    } catch (error) {
      modelOutputVerified = false;
    }
    const modelVersionValid = typeof candidate.modelVersion === 'string' &&
      policyUsable && candidate.modelVersion === policy.calibration.modelVersion;
    const unambiguous = !ambiguousCandidateIds.has(candidate.candidateId) &&
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
    return {
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
    };
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
    decidedAt: new Date().toISOString(),
    decisions,
    reportNotice: decisions.some(item => item.decision === 'AUTO_ACCEPTED')
      ? 'Vínculo DRT–produto técnico admitido automaticamente pelo sistema, conforme política calibrada da Base. A validação normativa institucional desta regra permanece pendente; ciência do vistoriador necessária.'
      : null,
  });
  ASSOCIATION_ARTIFACTS_.set(artifact, {
    view: input.view,
    resolution: input.resolution,
    contract: input.contract,
    submissionId: input.submissionId,
    baseId: input.baseId,
    rdeDigest: input.rdeDigest,
  });
  return artifact;
}

function isCanonicalAutomaticAssociationArtifact(artifact, expected, view, resolution, contract) {
  const binding = artifact && ASSOCIATION_ARTIFACTS_.get(artifact);
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
