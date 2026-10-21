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
vm.runInContext(fs.readFileSync(path.join(__dirname,
  '../apps-script/SignatureVerificationReceiptCore.js'), 'utf8'), context);

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  return '{' + Object.keys(value).sort().map(key =>
    JSON.stringify(key) + ':' + canonicalJson(value[key])).join(',') + '}';
}

const rsaReceipt = {
  payload: sourceFixture.payload,
  authentication: {
    keyId,
    algorithm: 'RSA_SHA256_PKCS1_V1_5',
    signature: crypto.sign('RSA-SHA256', Buffer.from(canonicalJson(sourceFixture.payload), 'utf8'),
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
  presentationIdentity: 'protocol:TEST_PROTOCOL|re:TEST_RE|date:2026-10-20',
  rdeIdentity: 'rde:TEST_RDE',
  rdeDigest: 'a'.repeat(64),
  sourceDocumentIdentity: 'drive-file:TEST_PDF',
  sourceDocumentDigest: '666040a51133be38e11fe560dc3a2f06a537cbf0eb0116870f2f1d16ee84f225'
};

function verify(receiptJson = serializedReceipt, binding = expected) {
  context.receiptJson = receiptJson;
  context.expectedBindingJson = JSON.stringify(binding);
  return vm.runInContext(
    'verifySignatureVerificationReceipt_(JSON.parse(receiptJson), JSON.parse(expectedBindingJson))',
    context
  );
}

function verifyMutated(mutationSource, binding = expected) {
  context.receiptJson = serializedReceipt;
  context.mutationSource = mutationSource;
  context.expectedBindingJson = JSON.stringify(binding);
  return vm.runInContext(
    '(function () { const receipt = JSON.parse(receiptJson); ' +
      '(' + context.mutationSource + ')(receipt); ' +
      'return verifySignatureVerificationReceipt_(receipt, JSON.parse(expectedBindingJson)); })()',
    context
  );
}

assert.equal(verify(), true, 'Python receipt payload signed by RSA test key must verify');
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
  ['presentationIdentity', 'other presentation'],
  ['rdeIdentity', 'other RDE'],
  ['rdeDigest', 'c'.repeat(64)],
  ['sourceDocumentIdentity', 'other document'],
  ['sourceDocumentDigest', 'd'.repeat(64)]
]) {
  const changed = { ...expected, [field]: value };
  assert.equal(verify(serializedReceipt, changed), false, field + ' replay must fail');
}

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

process.stdout.write('apps-script-signature-verification-receipt: PASS\n');
