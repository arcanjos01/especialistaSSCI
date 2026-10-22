const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourceFixture = JSON.parse(fs.readFileSync(path.join(__dirname,
  'fixtures/signature-verification-receipt-v1.json'), 'utf8'));
const keyId = 'LOCAL_VERIFIER_KEY_V1';
const keyPair = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicExponent: 65537
});
const admissionAuthorityKeyId = 'SYNTHETIC_ADMISSION_AUTHORITY_V1';
const admissionAuthorityPair = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicExponent: 65537
});
const admissionAuthorityJwk = admissionAuthorityPair.publicKey.export({ format: 'jwk' });
const admissionAuthorityModulusHex = Buffer.from(admissionAuthorityJwk.n, 'base64url').toString('hex');
const admissionAuthorityExponentHex = Buffer.from(admissionAuthorityJwk.e, 'base64url').toString('hex');
const publicJwk = keyPair.publicKey.export({ format: 'jwk' });
const modulusHex = Buffer.from(publicJwk.n, 'base64url').toString('hex');
const exponentHex = Buffer.from(publicJwk.e, 'base64url').toString('hex');
let pinnedModulusHex = modulusHex;
let pinnedExponentHex = exponentHex;
let pinnedKeyId = keyId;
const context = {
  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty(name) {
          if (name === 'SSCI_SIGNATURE_VERIFICATION_RSA_KEY_ID') return pinnedKeyId;
          if (name === 'SSCI_SIGNATURE_VERIFICATION_RSA_MODULUS_HEX') return pinnedModulusHex;
          if (name === 'SSCI_SIGNATURE_VERIFICATION_RSA_EXPONENT_HEX') return pinnedExponentHex;
          if (name === 'SSCI_SIGNATURE_ADMISSION_PROFILE_RSA_KEY_ID') return admissionAuthorityKeyId;
          if (name === 'SSCI_SIGNATURE_ADMISSION_PROFILE_RSA_MODULUS_HEX') return admissionAuthorityModulusHex;
          if (name === 'SSCI_SIGNATURE_ADMISSION_PROFILE_RSA_EXPONENT_HEX') return admissionAuthorityExponentHex;
          return null;
        }
      };
    }
  },
  Utilities: {
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF_8' },
    computeDigest(algorithm, payload, charset) {
      assert.equal(algorithm, 'SHA_256');
      assert.equal(charset, 'UTF_8');
      return Array.from(crypto.createHash('sha256').update(payload, 'utf8').digest());
    },
    base64Decode(value) {
      return Array.from(Buffer.from(value, 'base64'));
    },
    base64Encode(bytes) {
      return Buffer.from(bytes).toString('base64');
    }
  }
};
vm.createContext(context);
for (const relativePath of [
  '../apps-script/CompiledRuntimeContract.js',
  '../apps-script/EngineCore.js',
  '../apps-script/RdeCore.js',
  '../apps-script/ExecutionViewCore.js',
  '../apps-script/CurrentSubmissionContextCore.js',
  '../apps-script/CbmscApplicabilityCore.js',
  '../apps-script/ExecutionPlanCore.js',
  '../apps-script/SignatureVerificationReceiptCore.js'
]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, relativePath), 'utf8'), context);
}
context.currentSubmissionContextForVerification = vm.runInContext(
  "createCurrentSubmissionContext({processId:'TEST_PROCESS',protocolIdentifier:'TEST_PROTOCOL'," +
  "requestDate:'2026-10-20',reIdentifier:'TEST_RE'," +
  "provenance:{sourceKind:'TEST_ONLY',sourceReference:'TEST_INTAKE'}})", context
);
const authenticatedPresentationContext = context.currentSubmissionContextForVerification;
const canonicalPresentationIdentity = vm.runInContext(
  'getCanonicalPresentationIdentity(currentSubmissionContextForVerification)', context
);

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  return '{' + Object.keys(value).sort().map(key =>
    JSON.stringify(key) + ':' + canonicalJson(value[key])).join(',') + '}';
}

assert.equal(sourceFixture.payload.presentationIdentity, canonicalPresentationIdentity,
  'static receipt fixture must carry the canonical presentation identity');
const canonicalPayload = sourceFixture.payload;
const rsaReceipt = {
  payload: canonicalPayload,
  authentication: {
    keyId,
    algorithm: 'RSA_SHA256_PKCS1_V1_5',
    signature: crypto.sign('RSA-SHA256', Buffer.from(canonicalJson(canonicalPayload), 'utf8'),
      keyPair.privateKey).toString('base64')
  }
};
function signPayload(payload) {
  return crypto.sign('RSA-SHA256', Buffer.from(canonicalJson(payload), 'utf8'),
    keyPair.privateKey).toString('base64');
}
function authenticatedReceipt(payload) {
  return {
    payload,
    authentication: {
      keyId,
      algorithm: 'RSA_SHA256_PKCS1_V1_5',
      signature: signPayload(payload)
    }
  };
}
const serializedReceipt = JSON.stringify(rsaReceipt);
const expected = {
  rdeIdentity: 'rde:TEST_RDE',
  rdeDigest: 'a'.repeat(64),
  sourceDocumentIdentity: 'drive-file:TEST_PDF',
  sourceDocumentDigest: '666040a51133be38e11fe560dc3a2f06a537cbf0eb0116870f2f1d16ee84f225'
};

function verify(receiptJson = serializedReceipt, binding = expected,
  currentContext = authenticatedPresentationContext) {
  context.receiptJson = receiptJson;
  context.expectedBindingJson = JSON.stringify(binding);
  context.currentSubmissionContextForVerification = currentContext;
  try {
    return vm.runInContext(
      'verifySignatureVerificationReceipt_(JSON.parse(receiptJson), Object.assign(' +
        'JSON.parse(expectedBindingJson), { currentSubmissionContext: currentSubmissionContextForVerification }))',
      context
    );
  } finally {
    context.currentSubmissionContextForVerification = authenticatedPresentationContext;
  }
}

function verifyMutated(mutationSource, binding = expected) {
  context.receiptJson = serializedReceipt;
  context.mutationSource = mutationSource;
  context.expectedBindingJson = JSON.stringify(binding);
  return vm.runInContext(
    '(function () { const receipt = JSON.parse(receiptJson); ' +
      '(' + context.mutationSource + ')(receipt); ' +
      'return verifySignatureVerificationReceipt_(receipt, Object.assign(' +
      'JSON.parse(expectedBindingJson), { currentSubmissionContext: currentSubmissionContextForVerification })); })()',
    context
  );
}

assert.equal(verify(), true, 'Python receipt payload signed by RSA test key must verify');
const missingExecutableDigestPayload = JSON.parse(JSON.stringify(sourceFixture.payload));
delete missingExecutableDigestPayload.verificationResult.verifier_components.openssl_executable_sha256;
assert.equal(verify(JSON.stringify(authenticatedReceipt(missingExecutableDigestPayload))), false,
  'receipt must require both verifier executable digests even when authentication is valid');
const unicodePayload = JSON.parse(JSON.stringify(rsaReceipt.payload));
unicodePayload.receiptId = '😀'.repeat(64);
unicodePayload.createdAt = '2026-10-20T12:00:00.123456Z';
assert.equal(verify(JSON.stringify(authenticatedReceipt(unicodePayload))), true,
  'valid UTF-16 boundary and fractional timestamp must verify cross-runtime');
assert.equal(verify(JSON.stringify(sourceFixture)), false,
  'shared-secret HMAC envelope is preparatory and must not be accepted by the runtime verifier');
const originalModulus = pinnedModulusHex;
pinnedModulusHex = 'f'.repeat(512);
assert.equal(verify(), false, 'malformed/unmatched pinned modulus must fail closed');
pinnedModulusHex = originalModulus;
const originalExponent = pinnedExponentHex;
pinnedExponentHex = '03';
assert.equal(verify(), false, 'unapproved public exponent must fail closed');
pinnedExponentHex = originalExponent;
const originalKeyId = pinnedKeyId;
pinnedKeyId = 'ROTATED_UNPINNED_KEY';
assert.equal(verify(), false, 'receipt key id must match the independently pinned key id');
pinnedKeyId = originalKeyId;
assert.equal(vm.runInContext(
  "Object.getOwnPropertyDescriptor(globalThis, 'verifySignatureVerificationReceipt_').writable",
  context
), false);

for (const [field, value] of [
  ['rdeIdentity', 'other RDE'],
  ['rdeDigest', 'c'.repeat(64)],
  ['sourceDocumentIdentity', 'other document'],
  ['sourceDocumentDigest', 'd'.repeat(64)]
]) {
  const changed = { ...expected, [field]: value };
  assert.equal(verify(serializedReceipt, changed), false, field + ' replay must fail');
}
const differentPresentationContext = vm.runInContext(
  "createCurrentSubmissionContext({processId:'TEST_PROCESS',protocolIdentifier:'TEST_PROTOCOL'," +
  "requestDate:'2026-10-21',reIdentifier:'TEST_RE'," +
  "provenance:{sourceKind:'TEST_ONLY',sourceReference:'TEST_INTAKE'}})", context
);
assert.equal(verify(serializedReceipt, expected, differentPresentationContext), false,
  'receipt replay under another authenticated request date must fail');
const samePresentationDifferentMetadataContext = vm.runInContext(
  "createCurrentSubmissionContext({processId:'OTHER_PROCESS',protocolIdentifier:'TEST_PROTOCOL'," +
  "requestDate:'2026-10-20',reIdentifier:'OTHER_RE'," +
  "provenance:{sourceKind:'OTHER_TEST',sourceReference:'OTHER_INTAKE'}})", context
);
assert.equal(verify(serializedReceipt, expected, samePresentationDifferentMetadataContext), true,
  'RE, process and intake metadata are not presentation identity components');
const clonedPresentationContext = vm.runInContext(
  'Object.freeze({ ...currentSubmissionContextForVerification })', context
);
assert.equal(verify(serializedReceipt, expected, clonedPresentationContext), false,
  'an unbranded context clone must not establish presentation binding');
assert.equal(verify(serializedReceipt, { ...expected, presentationIdentity: canonicalPresentationIdentity }), false,
  'caller-supplied presentation identity must not be accepted as a binding field');

const tampered = JSON.parse(serializedReceipt);
tampered.payload.verificationResult.professional_identity = 'VERIFIED';
assert.equal(verify(JSON.stringify(tampered)), false, 'tampered result must fail authentication');

const unknownEnvelopeKey = JSON.parse(serializedReceipt);
unknownEnvelopeKey.extra = true;
assert.equal(verify(JSON.stringify(unknownEnvelopeKey)), false, 'unknown envelope key must fail');

const unknownKeyId = JSON.parse(serializedReceipt);
unknownKeyId.authentication.keyId = 'UNPINNED_KEY';
assert.equal(verify(JSON.stringify(unknownKeyId)), false, 'unknown key id must fail');

const unsafe = JSON.parse(serializedReceipt);
Object.defineProperty(unsafe.payload.verificationResult.signatures[0], '__proto__', {
  value: { forged: true }, enumerable: true, configurable: true
});
assert.equal(verify(JSON.stringify(unsafe)), false, 'unsafe nested property must fail');

assert.equal(verifyMutated('function (receipt) {}'), true,
  'adversarial mutation helper must pass a valid same-realm fixture');
assert.equal(verifyMutated(`function (receipt) {
  receipt.payload.verificationResult.signatures[0].integrity.result = 'FORGED';
  const forgedArrayPrototype = Object.create(Array.prototype);
  forgedArrayPrototype.map = function () { return [
    '{"coverage":{"full_document_current_revision":true},"field":"Sig1","integrity":{"result":"VALID"}}'
  ]; };
  Object.setPrototypeOf(receipt.payload.verificationResult.signatures, forgedArrayPrototype);
}`), false,
  'custom array prototype must not control authenticated canonicalization');

assert.equal(verifyMutated(`function (receipt) {
  Object.defineProperty(receipt.payload.verificationResult.signatures[0], 'forged', {
    value: true, enumerable: false
  });
}`), false,
  'non-enumerable data must not be omitted from authenticated canonicalization');

const invalidTimestamp = JSON.parse(serializedReceipt);
invalidTimestamp.payload.createdAt = '2026-10-20 12:00:00Z';
assert.equal(verify(JSON.stringify(invalidTimestamp)), false,
  'non-canonical timestamp form must fail');

const oversizedUtf16 = JSON.parse(serializedReceipt);
oversizedUtf16.payload.receiptId = '😀'.repeat(80);
assert.equal(verify(JSON.stringify(oversizedUtf16)), false,
  'text limits must count JavaScript UTF-16 code units');

assert.equal(
  JSON.parse(serializedReceipt).payload.verificationResult.revocation,
  'UNKNOWN/NOT_EVALUATED',
  'receipt fixture preserves unverified revocation as unknown'
);

// The preparatory binding is branded, immutable and scoped to the exact frozen
// objects. It deliberately does not make SIGNED admissible.
const executionBindingRdeInput = {
  schema_version: '0.2.0', process_id: 'TEST_PROCESS',
  source: { file_id: 'TEST_SOURCE_FILE', file_name: 'test.pdf', mime_type: 'application/pdf',
    source_url: 'https://example.invalid/test.pdf', sha256: '0'.repeat(64) },
  extraction: { provider: 'TEST_ONLY', extractor_version: 'TEST_ONLY',
    created_at: '2026-10-20T12:00:00.000Z' },
  records: [{ record_id: 'TEST_PRESENTATION_DOCUMENT',
    entity_id: 'COMPROVANTE_DE_SOLICITACAO_DE_HABITESE', parent_record_id: null,
    source_document: 'TEST_PRESENTATION_DOCUMENT',
    attributes: { PROTOCOL_IDENTIFIER: 'TEST_PROTOCOL', REQUEST_DATE: '2026-10-20',
      RE_IDENTIFIER: 'TEST_RE' } }, {
    record_id: 'TEST_SYSTEM_SECTION', entity_id: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA',
    parent_record_id: 'TEST_PRESENTATION_DOCUMENT', source_document: 'TEST_PRESENTATION_DOCUMENT',
    attributes: { STRUCTURALLY_COMPLETE: true, LEGIBLE: true, VERIFIABLE: true }
  }], extraction_warnings: []
};
context.executionBindingRdeJson = JSON.stringify(executionBindingRdeInput);
const executionBindingRde = vm.runInContext(
  "parseAndValidateOperationalRdeJson_(executionBindingRdeJson,{processId:'TEST_PROCESS'," +
  "sourceFileId:'TEST_SOURCE_FILE',rdeIdentity:'rde:TEST_RDE'},COMPILED_RUNTIME_CONTRACT.entityCatalog)", context
);
context.executionBindingRde = executionBindingRde;
const executionBindingView = vm.runInContext(
  'projectRdeToExecutionView_(executionBindingRde, COMPILED_RUNTIME_CONTRACT.entityCatalog)', context
);
const executionBindingSource = vm.runInContext(
  "new TypedReference('DOCUMENT', 'TEST_PRESENTATION_DOCUMENT')", context
);
context.executionBindingSource = executionBindingSource;
context.executionBindingView = executionBindingView;
const executionBindingPlan = vm.runInContext(
  'materializeFrozenExecutionPlan(COMPILED_RUNTIME_CONTRACT,' +
  'resolveCbmscApplicability(executionBindingView, currentSubmissionContextForVerification,' +
  'COMPILED_RUNTIME_CONTRACT), executionBindingView)', context
);
context.executionBindingPlan = executionBindingPlan;
const bindingPayload = JSON.parse(JSON.stringify(rsaReceipt.payload));
bindingPayload.rdeDigest = vm.runInContext('getValidatedRdeDigest_(executionBindingRde)', context);
const bindingReceipt = authenticatedReceipt(bindingPayload);
context.bindingReceiptJson = JSON.stringify(bindingReceipt);
const technicalBinding = vm.runInContext(
  'createTechnicalReceiptExecutionBinding_(bindingReceiptJson, COMPILED_RUNTIME_CONTRACT,' +
  'executionBindingPlan, executionBindingView, executionBindingRde,' +
  'executionBindingSource, currentSubmissionContextForVerification)', context
);
assert.ok(technicalBinding, 'a valid technical receipt can be bound to the exact execution objects');
assert.equal(technicalBinding.admissionStatus, 'MANUAL_REVIEW');
assert.deepEqual(JSON.parse(JSON.stringify(technicalBinding.diagnostics)), [
  'ADMISSION_PROFILE_UNDEFINED', 'SOURCE_DOCUMENT_IDENTITY_DIGEST_NOT_INDEPENDENTLY_AUTHENTICATED'
]);
assert.equal(Object.isFrozen(technicalBinding), true);
context.technicalBinding = technicalBinding;
assert.equal(vm.runInContext(
  'isAuthenticatedTechnicalReceiptExecutionBinding_(technicalBinding, COMPILED_RUNTIME_CONTRACT,' +
  'executionBindingPlan, executionBindingView, executionBindingRde,' +
  "new TypedReference('DOCUMENT', 'TEST_PRESENTATION_DOCUMENT'), currentSubmissionContextForVerification)", context
), false, 'a distinct TypedReference instance cannot replay the binding');
assert.equal(vm.runInContext(
  'isAuthenticatedTechnicalReceiptExecutionBinding_(technicalBinding, COMPILED_RUNTIME_CONTRACT,' +
  'executionBindingPlan, executionBindingView, executionBindingRde, executionBindingSource,' +
  'currentSubmissionContextForVerification)', context
), true, 'the branded binding accepts only its exact source-document reference');
assert.equal(vm.runInContext(
  'isAuthenticatedTechnicalReceiptExecutionBinding_(Object.freeze({...technicalBinding}),' +
  'COMPILED_RUNTIME_CONTRACT, executionBindingPlan, executionBindingView, executionBindingRde,' +
  'executionBindingSource, currentSubmissionContextForVerification)', context
), false, 'a forged frozen binding object is rejected');
assert.equal(vm.runInContext(
  'createTechnicalReceiptExecutionBinding_(bindingReceiptJson, COMPILED_RUNTIME_CONTRACT,' +
  'executionBindingPlan, executionBindingView, executionBindingRde, executionBindingSource,' +
  'currentSubmissionContextForVerification)', context
), null, 'duplicate receipt ids are rejected before reuse');
assert.equal(vm.runInContext(
  'isAuthenticatedTechnicalReceiptExecutionBinding_(technicalBinding, COMPILED_RUNTIME_CONTRACT,' +
  'executionBindingPlan, executionBindingView, executionBindingRde, executionBindingSource,' +
  'createCurrentSubmissionContext({processId:"TEST_PROCESS",protocolIdentifier:"TEST_PROTOCOL",' +
  'requestDate:"2026-10-21",reIdentifier:"TEST_RE",provenance:{sourceKind:"TEST_ONLY",sourceReference:"TEST_INTAKE"}}))', context
), false, 'a divergent authenticated submission context cannot consume the binding');

// Authenticity checks use real canonical objects, never a replacement verifier.
function createBindingWith(overrides = {}) {
  context.bindingOverrides = overrides;
  return vm.runInContext(`createTechnicalReceiptExecutionBinding_(
    Object.prototype.hasOwnProperty.call(bindingOverrides, 'receipt') ? bindingOverrides.receipt : bindingReceiptJson,
    bindingOverrides.contract || COMPILED_RUNTIME_CONTRACT,
    bindingOverrides.plan || executionBindingPlan,
    bindingOverrides.view || executionBindingView,
    bindingOverrides.rde || executionBindingRde,
    bindingOverrides.source || executionBindingSource,
    bindingOverrides.submission || currentSubmissionContextForVerification,
    bindingOverrides.profile)`, context);
}
const freshPayload = JSON.parse(JSON.stringify(bindingPayload));
freshPayload.receiptId = 'TEST_BINDING_NEGATIVES';
const freshReceipt = JSON.stringify(authenticatedReceipt(freshPayload));
assert.equal(createBindingWith({ receipt: authenticatedReceipt(freshPayload) }), null,
  'the boundary accepts JSON text only, never caller objects or accessors');
assert.equal(createBindingWith({ receipt: freshReceipt, contract: Object.freeze({}) }), null);
assert.equal(createBindingWith({ receipt: freshReceipt, plan: Object.freeze({ ...executionBindingPlan }) }), null,
  'a frozen plan copy is not a canonical frozen plan');
assert.equal(createBindingWith({ receipt: freshReceipt, view: Object.freeze({}) }), null);
assert.equal(createBindingWith({ receipt: freshReceipt, rde: JSON.parse(JSON.stringify(executionBindingRde)) }), null,
  'an equivalent RDE copy is not the authenticated extraction object');
assert.equal(createBindingWith({ receipt: freshReceipt, source: vm.runInContext(
  "new TypedReference('DOCUMENT', 'NOT_PRESENT')", context) }), null);
assert.equal(createBindingWith({ receipt: freshReceipt, source: vm.runInContext(
  "new TypedReference('ENTITY', 'TEST_SYSTEM_SECTION')", context) }), null,
  'a non-document fact cannot be substituted as the source document');
assert.equal(createBindingWith({ receipt: freshReceipt, submission: Object.freeze({}) }), null);
const tamperedReceipt = JSON.parse(freshReceipt);
tamperedReceipt.payload.rdeDigest = 'b'.repeat(64);
assert.equal(createBindingWith({ receipt: JSON.stringify(tamperedReceipt) }), null,
  'tampering cannot consume the receipt id');
const secondBinding = createBindingWith({ receipt: freshReceipt });
assert.ok(secondBinding, 'rejected candidates do not reserve a receipt id');
context.secondBinding = secondBinding;
freshPayload.verificationResult.signature_count = 999;
context.bindingReceiptJson = '{}';
assert.equal(vm.runInContext(
  'isAuthenticatedTechnicalReceiptExecutionBinding_(secondBinding, COMPILED_RUNTIME_CONTRACT,' +
  'executionBindingPlan, executionBindingView, executionBindingRde, executionBindingSource,' +
  'currentSubmissionContextForVerification)', context
), true, 'later caller mutations cannot alter the stored receipt snapshot');
assert.equal(Object.isFrozen(secondBinding.diagnostics), true);
assert.equal(Object.isFrozen(secondBinding.sourceDocumentReference), true);
const secondPlan = vm.runInContext(
  'materializeFrozenExecutionPlan(COMPILED_RUNTIME_CONTRACT,' +
  'resolveCbmscApplicability(executionBindingView, currentSubmissionContextForVerification,' +
  'COMPILED_RUNTIME_CONTRACT), executionBindingView)', context
);
context.secondPlan = secondPlan;
assert.equal(vm.runInContext(
  'isAuthenticatedTechnicalReceiptExecutionBinding_(secondBinding, COMPILED_RUNTIME_CONTRACT,' +
  'secondPlan, executionBindingView, executionBindingRde, executionBindingSource,' +
  'currentSubmissionContextForVerification)', context
), false, 'a second genuine plan cannot consume the first plan binding');
assert.equal(createBindingWith({ receipt: freshReceipt, plan: secondPlan }), null,
  'receipt ids are unique within this runtime even across genuine plans');

function signedAdmissionProfile(payload) {
  const payloadText = canonicalJson(payload);
  return JSON.stringify({ payload, authentication: {
    keyId: admissionAuthorityKeyId, algorithm: 'RSA_SHA256_PKCS1_V1_5',
    digest: crypto.createHash('sha256').update(payloadText, 'utf8').digest('hex'),
    signature: crypto.sign('RSA-SHA256', Buffer.from(payloadText, 'utf8'), admissionAuthorityPair.privateKey).toString('base64')
  }});
}
function admissionProfileJson() {
  const contractText = canonicalJson(context.COMPILED_RUNTIME_CONTRACT);
  const payload = {
    profileType: 'SIGNATURE_ADMISSION_PROFILE', schemaVersion: '0.1.0',
    compiledContractDigest: crypto.createHash('sha256').update(contractText, 'utf8').digest('hex'),
    policyId: 'SYNTHETIC_POLICY', policyVersion: 'SYNTHETIC_V1', policyDigest: '1'.repeat(64),
    permittedMechanism: 'SYNTHETIC_RSA_TEST', trustedIssuerSet: ['SYNTHETIC_ISSUER'],
    trustedIssuerSetDigest: '2'.repeat(64), requiredCryptographicChecks: ['SYNTHETIC_INTEGRITY_CHECK'],
    requiredSignerIssuerRole: 'SYNTHETIC_SIGNER_OR_ISSUER', validationLevel: 'SYNTHETIC_FIXTURE_ONLY',
    unknownTreatment: 'MANUAL_REVIEW'
  };
  return signedAdmissionProfile(payload);
}
const validAdmissionProfile = admissionProfileJson();
context.validAdmissionProfile = validAdmissionProfile;
assert.equal(vm.runInContext('verifySignatureAdmissionProfile_(validAdmissionProfile, COMPILED_RUNTIME_CONTRACT)', context), true,
  'synthetic profile signed by distinct authority key is accepted preparatorily');
const preparatoryProfileReceiptPayload = JSON.parse(JSON.stringify(bindingPayload));
preparatoryProfileReceiptPayload.receiptId = 'TEST_PREPARATORY_PROFILE_BINDING';
assert.equal(createBindingWith({
  receipt: JSON.stringify(authenticatedReceipt(preparatoryProfileReceiptPayload)),
  profile: validAdmissionProfile
}).admissionStatus, 'MANUAL_REVIEW',
'an authenticated preparatory profile never authorizes automatic Engine admission');
const emptyIssuerSet = JSON.parse(validAdmissionProfile);
emptyIssuerSet.payload.trustedIssuerSet = [];
context.emptyIssuerSetProfile = signedAdmissionProfile(emptyIssuerSet.payload);
assert.equal(vm.runInContext('verifySignatureAdmissionProfile_(emptyIssuerSetProfile, COMPILED_RUNTIME_CONTRACT)', context), false,
  'an authenticated profile without trust issuers is rejected');
const emptyChecks = JSON.parse(validAdmissionProfile);
emptyChecks.payload.requiredCryptographicChecks = [];
context.emptyChecksProfile = signedAdmissionProfile(emptyChecks.payload);
assert.equal(vm.runInContext('verifySignatureAdmissionProfile_(emptyChecksProfile, COMPILED_RUNTIME_CONTRACT)', context), false,
  'an authenticated profile without required cryptographic checks is rejected');
const duplicateIssuerSet = JSON.parse(validAdmissionProfile);
duplicateIssuerSet.payload.trustedIssuerSet.push(duplicateIssuerSet.payload.trustedIssuerSet[0]);
context.duplicateIssuerSetProfile = signedAdmissionProfile(duplicateIssuerSet.payload);
assert.equal(vm.runInContext('verifySignatureAdmissionProfile_(duplicateIssuerSetProfile, COMPILED_RUNTIME_CONTRACT)', context), false,
  'a correctly authenticated profile with duplicate trust issuers is rejected by schema validation');
const duplicateRequiredChecks = JSON.parse(validAdmissionProfile);
duplicateRequiredChecks.payload.requiredCryptographicChecks.push(
  duplicateRequiredChecks.payload.requiredCryptographicChecks[0]);
context.duplicateRequiredChecksProfile = signedAdmissionProfile(duplicateRequiredChecks.payload);
assert.equal(vm.runInContext('verifySignatureAdmissionProfile_(duplicateRequiredChecksProfile, COMPILED_RUNTIME_CONTRACT)', context), false,
  'a correctly authenticated profile with duplicate checks is rejected by schema validation');
const forgedProfile = JSON.parse(validAdmissionProfile);
forgedProfile.payload.policyId = 'FORGED_POLICY';
context.forgedProfile = JSON.stringify(forgedProfile);
assert.equal(vm.runInContext('verifySignatureAdmissionProfile_(forgedProfile, COMPILED_RUNTIME_CONTRACT)', context), false,
  'forged profile is rejected');
const sharedKeyProfile = JSON.parse(validAdmissionProfile);
sharedKeyProfile.authentication.keyId = keyId;
sharedKeyProfile.authentication.signature = crypto.sign('RSA-SHA256', Buffer.from(canonicalJson(sharedKeyProfile.payload), 'utf8'), keyPair.privateKey).toString('base64');
context.sharedKeyProfile = JSON.stringify(sharedKeyProfile);
assert.equal(vm.runInContext('verifySignatureAdmissionProfile_(sharedKeyProfile, COMPILED_RUNTIME_CONTRACT)', context), false,
  'verifier key cannot authenticate the admission profile');
const wrongContractProfile = JSON.parse(validAdmissionProfile);
wrongContractProfile.payload.compiledContractDigest = '3'.repeat(64);
context.wrongContractProfile = signedAdmissionProfile(wrongContractProfile.payload);
assert.equal(vm.runInContext('verifySignatureAdmissionProfile_(wrongContractProfile, COMPILED_RUNTIME_CONTRACT)', context), false,
  'a correctly authenticated profile for a different compiled contract is rejected by schema validation');
const extraProfileField = JSON.parse(validAdmissionProfile);
extraProfileField.payload.extra = true;
context.extraProfileField = signedAdmissionProfile(extraProfileField.payload);
assert.equal(vm.runInContext('verifySignatureAdmissionProfile_(extraProfileField, COMPILED_RUNTIME_CONTRACT)', context), false,
  'a correctly authenticated profile with an extra payload field is rejected by schema validation');
const unknownPolicyProfile = JSON.parse(validAdmissionProfile);
unknownPolicyProfile.payload.unknownTreatment = 'UNKNOWN';
context.unknownPolicyProfile = signedAdmissionProfile(unknownPolicyProfile.payload);
assert.equal(vm.runInContext('verifySignatureAdmissionProfile_(unknownPolicyProfile, COMPILED_RUNTIME_CONTRACT)', context), false,
  'a correctly authenticated profile with unknown treatment is rejected by schema validation');

// Regressions for independent review findings HIGH and MEDIUM.
const referenceAttackPayload = JSON.parse(JSON.stringify(bindingPayload));
referenceAttackPayload.receiptId = 'TEST_MUTABLE_REFERENCE';
context.referenceAttackReceiptJson = JSON.stringify(authenticatedReceipt(referenceAttackPayload));
context.mutableSourceReference = vm.runInContext(
  "Object.assign(Object.create(TypedReference.prototype), {kind:'DOCUMENT'," +
  "identifier:'TEST_PRESENTATION_DOCUMENT'})", context
);
assert.equal(createBindingWith({ receipt: context.referenceAttackReceiptJson,
  source: context.mutableSourceReference }), null,
  'prototype-forged mutable references are rejected before storing private state');
assert.ok(createBindingWith({ receipt: context.referenceAttackReceiptJson }),
  'rejected mutable references do not consume the receipt id');
const serializerAttackReceipt = JSON.parse(freshReceipt);
serializerAttackReceipt.payload.receiptId = 'TEST_UNSIGNED_RECEIPT_ID';
context.serializerAttackReceiptJson = JSON.stringify(serializerAttackReceipt);
assert.equal(vm.runInContext(`(() => {
  const originalStringify = JSON.stringify;
  JSON.stringify = value => originalStringify(value === 'TEST_UNSIGNED_RECEIPT_ID'
    ? 'TEST_BINDING_NEGATIVES' : value);
  try {
    return createTechnicalReceiptExecutionBinding_(serializerAttackReceiptJson,
      COMPILED_RUNTIME_CONTRACT, executionBindingPlan, executionBindingView,
      executionBindingRde, executionBindingSource, currentSubmissionContextForVerification);
  } finally { JSON.stringify = originalStringify; }
})()`, context), null, 'late JSON.stringify replacement cannot authenticate an unsigned receipt id');

process.stdout.write('apps-script-signature-verification-receipt: PASS\n');
