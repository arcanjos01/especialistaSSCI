'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const key = Buffer.alloc(32, 7).toString('base64url');
const expectedContext = {
  rdeIdentity: 'rde-001',
  rdeDigest: '1'.repeat(64),
  sourceDocumentIdentity: 'file-001',
  sourceDocumentDigest: '2'.repeat(64)
};
const evidenceReferences = Object.freeze([Object.freeze({
  documentIdentity: 'file-001', documentDigest: '2'.repeat(64),
  locator: 'PDF page 1, signature field', description: 'Visible signature assessed by reviewer'
})]);
const properties = new Map([
  ['SSCI_HUMAN_SIGNATURE_REVIEW_HMAC_KEY', key],
  ['SSCI_HUMAN_SIGNATURE_REVIEW_HMAC_KEY_ID', 'TEST-KEY-1']
]);
const context = {
  PropertiesService: { getScriptProperties: () => ({ getProperty: name => properties.get(name) || null }) },
  Session: { getActiveUser: () => ({ getEmail: () => 'reviewer@example.test' }) },
  Utilities: {
    getUuid: () => 'receipt-uuid-001',
    computeHmacSha256Signature: (payload, secret) => crypto.createHmac('sha256', secret).update(payload).digest(),
    base64Encode: bytes => Buffer.from(bytes).toString('base64')
  }
};
vm.createContext(context);
for (const relativePath of [
  '../apps-script/CompiledRuntimeContract.js',
  '../apps-script/EngineCore.js',
  '../apps-script/RdeCore.js',
  '../apps-script/ExecutionViewCore.js',
  '../apps-script/CurrentSubmissionContextCore.js',
  '../apps-script/HumanSignatureReviewCore.js'
]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, relativePath), 'utf8'), context);
}
const inContext = value => vm.runInContext('JSON.parse(' + JSON.stringify(JSON.stringify(value)) + ')', context);
function makeReviewContext(submissionOverrides = {}) {
  context.reviewBindingJson = JSON.stringify(expectedContext);
  context.reviewSubmissionJson = JSON.stringify({
    processId: 'TEST_PROCESS',
    protocolIdentifier: 'TEST_PROTOCOL',
    requestDate: '2026-10-20',
    reIdentifier: 'TEST_RE',
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_INTAKE' },
    ...submissionOverrides
  });
  return vm.runInContext(`(() => {
    const binding = JSON.parse(reviewBindingJson);
    const submission = JSON.parse(reviewSubmissionJson);
    return Object.freeze({
      ...binding,
      currentSubmissionContext: createCurrentSubmissionContext(submission)
    });
  })()`, context);
}
const testContext = makeReviewContext();
const testEvidence = inContext(evidenceReferences);

const receipt = context.createHumanSignatureReviewReceipt_(testContext, inContext({
  reviewMethod: 'IN_DOCUMENT_VISUAL',
  methodDetails: 'Reviewed the exact document bytes identified in this receipt.',
  evidenceReferences: JSON.parse(JSON.stringify(evidenceReferences)),
  decision: 'CONFIRMED_SIGNATURE_PRESENT'
}));
assert.equal(context.verifyHumanSignatureReviewReceipt_(receipt, testContext), true);
assert.equal(receipt.payload.reviewerIdentity, 'reviewer@example.test');
assert.equal(receipt.payload.cryptographicStatus, 'NOT_EVALUATED_BY_HUMAN_REVIEW');
assert.equal(receipt.payload.authorityStatus, 'NOT_ESTABLISHED_AUDIT_ONLY');
assert.equal(Object.isFrozen(receipt), true);
assert.equal(Object.isFrozen(receipt.payload), true);
assert.throws(() => { receipt.payload.decision = 'NOT_CONFIRMED'; }, /read only|Cannot assign/i);

const changedPayload = JSON.parse(JSON.stringify(receipt));
changedPayload.payload.decision = 'NOT_CONFIRMED';
assert.equal(context.verifyHumanSignatureReviewReceipt_(inContext(changedPayload), testContext), false);
assert.equal(context.verifyHumanSignatureReviewReceipt_(receipt,
  makeReviewContext({ requestDate: '2026-10-21' })), false);
assert.equal(context.verifyHumanSignatureReviewReceipt_(receipt,
  makeReviewContext({ reIdentifier: 'OTHER_RE', processId: 'OTHER_PROCESS' })), true);
context.reviewBindingJson = JSON.stringify({
  ...expectedContext,
  presentationIdentity: 'caller-supplied'
});
assert.equal(context.verifyHumanSignatureReviewReceipt_(receipt, vm.runInContext(`(() => {
  const binding = JSON.parse(reviewBindingJson);
  return Object.freeze({ ...binding,
    currentSubmissionContext: createCurrentSubmissionContext(JSON.parse(reviewSubmissionJson)) });
})()`, context)), false);
assert.equal(context.verifyHumanSignatureReviewReceipt_(receipt, makeReviewContext()), true);
assert.equal(context.verifyHumanSignatureReviewReceipt_(receipt, inContext({
  ...expectedContext, sourceDocumentDigest: '3'.repeat(64)
})), false);

properties.set('SSCI_HUMAN_SIGNATURE_REVIEW_HMAC_KEY', Buffer.alloc(32, 8).toString('base64url'));
assert.equal(context.verifyHumanSignatureReviewReceipt_(receipt, testContext), false);
properties.set('SSCI_HUMAN_SIGNATURE_REVIEW_HMAC_KEY', key);
context.Session.getActiveUser = () => ({ getEmail: () => '' });
assert.throws(() => context.createHumanSignatureReviewReceipt_(testContext, inContext({
  reviewMethod: 'IN_DOCUMENT_VISUAL', methodDetails: 'No authenticated identity',
  evidenceReferences, decision: 'CONFIRMED_SIGNATURE_PRESENT'
})), /authenticated reviewer or project receipt key unavailable/);

context.Session.getActiveUser = () => ({ getEmail: () => 'reviewer@example.test' });
const sparseEvidence = new Array(1);
assert.throws(() => context.createHumanSignatureReviewReceipt_(testContext, inContext({
  reviewMethod: 'IN_DOCUMENT_VISUAL', methodDetails: 'Sparse evidence list',
  evidenceReferences: sparseEvidence, decision: 'INCONCLUSIVE'
})), /invalid human signature review input/);
assert.throws(() => context.createHumanSignatureReviewReceipt_(testContext, inContext({
  reviewMethod: 'IN_DOCUMENT_VISUAL', methodDetails: 'Cannot claim cryptographic validation',
  evidenceReferences, decision: 'CRYPTOGRAPHICALLY_VALID'
})), /invalid human signature review input/);

const engineSource = fs.readFileSync(path.join(__dirname, '../apps-script/EngineCore.js'), 'utf8');
assert.equal(engineSource.includes('verifyHumanSignatureReviewReceipt_'), false);
assert.equal(engineSource.includes('createHumanSignatureReviewReceipt_'), false);
const pipeline = fs.readFileSync(path.join(__dirname, '../knowledge-base/08_execution_pipeline.txt'), 'utf8');
assert.ok(pipeline.includes('NOT_ESTABLISHED_AUDIT_ONLY'));
assert.ok(pipeline.includes('The Engine has no consumer for this artifact.'));

console.log('apps-script-human-signature-review: PASS');
