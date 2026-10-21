const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const key = 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8';
const keyId = 'LOCAL_VERIFIER_KEY_V1';
const context = {
  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty(name) {
          if (name === 'SSCI_SIGNATURE_VERIFICATION_HMAC_KEY') return key;
          if (name === 'SSCI_SIGNATURE_VERIFICATION_HMAC_KEY_ID') return keyId;
          return null;
        }
      };
    }
  },
  Utilities: {
    computeHmacSha256Signature(payload, secret) {
      return Array.from(crypto.createHmac('sha256', secret).update(payload, 'utf8').digest());
    },
    base64Encode(bytes) {
      return Buffer.from(bytes).toString('base64');
    }
  }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,
  '../apps-script/SignatureVerificationReceiptCore.js'), 'utf8'), context);

const serializedReceipt = fs.readFileSync(path.join(__dirname,
  'fixtures/signature-verification-receipt-v1.json'), 'utf8').trim();
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

function verifyObject(receipt, binding = expected) {
  context.directReceipt = receipt;
  context.expectedBindingJson = JSON.stringify(binding);
  return vm.runInContext(
    'verifySignatureVerificationReceipt_(directReceipt, JSON.parse(expectedBindingJson))',
    context
  );
}

assert.equal(verify(), true, 'Python-authenticated fixture must verify in Apps Script');
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

const inheritedMap = JSON.parse(serializedReceipt);
inheritedMap.payload.verificationResult.signatures[0].integrity.result = 'FORGED';
const forgedArrayPrototype = Object.create(Array.prototype);
forgedArrayPrototype.map = () => [
  '{"coverage":{"full_document_current_revision":true},"field":"Sig1","integrity":{"result":"VALID"}}'
];
Object.setPrototypeOf(inheritedMap.payload.verificationResult.signatures, forgedArrayPrototype);
assert.equal(verifyObject(inheritedMap), false,
  'custom array prototype must not control authenticated canonicalization');

const nonEnumerable = JSON.parse(serializedReceipt);
Object.defineProperty(nonEnumerable.payload.verificationResult.signatures[0], 'forged', {
  value: true, enumerable: false
});
assert.equal(verifyObject(nonEnumerable), false,
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
