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
const ASSOCIATION_RELATION_TYPES_ = Object.freeze([
  'DRT_COVERS_TECHNICAL_PRODUCT'
]);

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
      typeof policy.calibration.falseAcceptanceRate !== 'number' ||
      !Number.isFinite(policy.calibration.falseAcceptanceRate) ||
      policy.calibration.falseAcceptanceRate < 0 || policy.calibration.falseAcceptanceRate > 1 ||
      typeof policy.calibration.maxFalseAcceptanceRate !== 'number' ||
      !Number.isFinite(policy.calibration.maxFalseAcceptanceRate) ||
      policy.calibration.maxFalseAcceptanceRate < 0 || policy.calibration.maxFalseAcceptanceRate > 1 ||
      policy.calibration.falseAcceptanceRate > policy.calibration.maxFalseAcceptanceRate ||
      typeof policy.calibration.version !== 'string' || !policy.calibration.version.trim() ||
      typeof policy.calibration.datasetDigest !== 'string' ||
      !/^sha256:[a-f0-9]{64}$/i.test(policy.calibration.datasetDigest) ||
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
  associationRequire_(typeof input.submissionId === 'string' && input.submissionId.trim(),
    'SUBMISSION_REQUIRED', 'exact submission identifier is required');
  associationRequire_(typeof input.baseId === 'string' && input.baseId.trim(),
    'BASE_REQUIRED', 'Base identifier is required');
  associationRequire_(typeof input.rdeDigest === 'string' &&
    /^sha256:[a-f0-9]{64}$/i.test(input.rdeDigest),
  'RDE_DIGEST_REQUIRED', 'SHA-256 digest of the validated RDE is required');
  associationRequire_(Array.isArray(input.candidates), 'CANDIDATES_INVALID',
    'candidate associations must be an array');
  associationRequire_(typeof input.verifyEvidenceRef === 'function',
    'EVIDENCE_VERIFIER_REQUIRED', 'evidence references must be verified against the exact RDE context');

  const candidateIds = new Set();
  const sourceGroups = new Map();
  input.candidates.forEach(candidate => {
    associationRequire_(candidate && typeof candidate.candidateId === 'string' &&
      candidate.candidateId.trim() && !candidateIds.has(candidate.candidateId),
    'CANDIDATE_INVALID', 'candidate identifiers must be present and unique');
    candidateIds.add(candidate.candidateId);
    if (!Array.isArray(candidate.sourceEvidenceRefs) ||
        !candidate.sourceEvidenceRefs.every(ref => typeof ref === 'string' && ref.trim())) return;
    const groupKey = String(candidate.relationType) + '|' +
      candidate.sourceEvidenceRefs.slice().sort().join('|');
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
    associationRequire_(ASSOCIATION_RELATION_TYPES_.includes(relationType),
      'RELATION_TYPE_UNSUPPORTED', 'unsupported association relation type');
    const policy = input.policies && input.policies[relationType];
    const policyUsable = associationPolicyIsUsable_(policy, input.baseId, relationType);
    const rejected = Array.isArray(input.humanRejections) &&
      input.humanRejections.includes(candidate.candidateId);
    const candidateRefsValid = Array.isArray(candidate.sourceEvidenceRefs) &&
      candidate.sourceEvidenceRefs.length > 0 &&
      candidate.sourceEvidenceRefs.every(ref => typeof ref === 'string' && ref.trim()) &&
      Array.isArray(candidate.targetEvidenceRefs) && candidate.targetEvidenceRefs.length > 0 &&
      candidate.targetEvidenceRefs.every(ref => typeof ref === 'string' && ref.trim());
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
    const unambiguous = !ambiguousCandidateIds.has(candidate.candidateId) &&
      candidate.competingCandidateCount === 0 && candidate.conflicted !== true;
    const passes = !rejected && policyUsable && candidateRefsValid && scoreValid &&
      provenanceValid && unambiguous && candidate.score >= policy.calibration.threshold;
    const reasons = [];
    if (rejected) reasons.push('HUMAN_REJECTION_PRECEDENCE');
    if (!policyUsable) reasons.push('CALIBRATED_BASE_POLICY_UNAVAILABLE');
    if (!candidateRefsValid) reasons.push('EVIDENCE_REFERENCES_INVALID');
    if (!scoreValid || (scoreValid && policyUsable && candidate.score < policy.calibration.threshold)) {
      reasons.push('BELOW_CALIBRATED_THRESHOLD');
    }
    if (!provenanceValid) reasons.push('PROVENANCE_UNVERIFIED');
    if (!unambiguous) reasons.push('CONFLICT_OR_AMBIGUITY');
    return {
      candidateId: candidate.candidateId,
      relationType,
      sourceEvidenceRefs: candidateRefsValid ? candidate.sourceEvidenceRefs : [],
      targetEvidenceRefs: candidateRefsValid ? candidate.targetEvidenceRefs : [],
      score: scoreValid ? candidate.score : null,
      decision: passes ? 'AUTO_ACCEPTED' : 'NOT_ADMITTED',
      reasonCodes: reasons,
      policyVersion: policyUsable ? policy.version : null,
      calibrationVersion: policyUsable ? policy.calibration.version : null,
    };
  });

  const artifact = associationCloneFreeze_({
    artifactType: 'AUTOMATIC_ASSOCIATION_DECISIONS',
    artifactVersion: 1,
    mode: 'ACTIVE_FAIL_CLOSED',
    submissionId: input.submissionId,
    baseId: input.baseId,
    rdeDigest: input.rdeDigest,
    normativeValidation: 'PENDING_INSTITUTIONAL_VALIDATION',
    decisions,
    reportNotice: decisions.some(item => item.decision === 'AUTO_ACCEPTED')
      ? 'Vínculo DRT–produto técnico admitido automaticamente pelo sistema, conforme política calibrada da Base. A validação normativa institucional desta regra permanece pendente; ciência do vistoriador necessária.'
      : null,
  });
  ASSOCIATION_ARTIFACTS_.set(artifact, {
    submissionId: input.submissionId,
    baseId: input.baseId,
    rdeDigest: input.rdeDigest,
  });
  return artifact;
}

function isCanonicalAutomaticAssociationArtifact(artifact, expected) {
  const binding = artifact && ASSOCIATION_ARTIFACTS_.get(artifact);
  return !!binding && artifact.artifactType === 'AUTOMATIC_ASSOCIATION_DECISIONS' &&
    artifact.artifactVersion === 1 && artifact.mode === 'ACTIVE_FAIL_CLOSED' &&
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
