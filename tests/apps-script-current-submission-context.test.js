const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {};
vm.createContext(context);
for (const relativePath of [
  '../apps-script/CompiledRuntimeContract.js',
  '../apps-script/EngineCore.js',
  '../apps-script/RdeCore.js',
  '../apps-script/ExecutionViewCore.js',
  '../apps-script/CurrentSubmissionContextCore.js'
]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, relativePath), 'utf8'), context);
}
vm.runInContext(`
globalThis.api = {
  COMPILED_RUNTIME_CONTRACT,
  TypedReference,
  ImmutableExecutionView,
  projectRdeToExecutionView_,
  parseAndValidateOperationalRdeJson_,
  CurrentSubmissionContextContractError,
  createCurrentSubmissionContext,
  selectCurrentComprovante
};`, context);
const api = context.api;

const protocol = 'TEST_ONLY_PROTOCOL';
const operationalContext = overrides => api.createCurrentSubmissionContext({
  processId: 'TEST_ONLY_TECHNICAL_PROCESS',
  protocolIdentifier: protocol,
  requestDate: '2026-01-28',
  reIdentifier: 'TEST_ONLY_RE_1',
  provenance: {
    sourceKind: 'TEST_ONLY',
    sourceReference: 'TEST_ONLY_INTAKE_1'
  },
  ...(overrides || {})
});

function makeView(records) {
  const rde = {
    schema_version: '0.2.0',
    process_id: 'TEST_ONLY_TECHNICAL_PROCESS',
    source: {
      file_id: 'TEST_ONLY_FILE', file_name: 'TEST_ONLY.pdf',
      mime_type: 'application/pdf', source_url: 'TEST_ONLY_URL',
      sha256: '0'.repeat(64)
    },
    extraction: {
      provider: 'TEST_ONLY', extractor_version: 'TEST_ONLY',
      created_at: '2026-10-06T12:00:00.000Z'
    },
    records: records.map(record => ({
      record_id: record.recordId,
      entity_id: 'COMPROVANTE_DE_SOLICITACAO_DE_HABITESE',
      parent_record_id: null,
      source_document: record.recordId,
      attributes: record.attributes,
      ...(record.provenance ? { provenance: record.provenance } : {})
    })),
    extraction_warnings: []
  };
  const authenticatedRde = api.parseAndValidateOperationalRdeJson_(JSON.stringify(rde), {
    processId: rde.process_id, sourceFileId: rde.source.file_id
  }, api.COMPILED_RUNTIME_CONTRACT.entityCatalog);
  return api.projectRdeToExecutionView_(
    authenticatedRde, api.COMPILED_RUNTIME_CONTRACT.entityCatalog
  );
}

function assertBlocker(action) {
  assert.throws(action, error =>
    error instanceof api.CurrentSubmissionContextContractError &&
    error.code === 'ARCHITECTURAL_BLOCKER'
  );
}

function selectId(records, submission = operationalContext()) {
  return api.selectCurrentComprovante(makeView(records), submission).identifier;
}

function matching(recordId = 'TEST_ONLY_CURRENT', attributes = {}, provenance) {
  const values = {
    PROTOCOL_IDENTIFIER: protocol,
    REQUEST_DATE: '2026-01-28',
    RE_IDENTIFIER: 'TEST_ONLY_RE_1',
    ...attributes
  };
  Object.keys(values).forEach(key => {
    if (values[key] === undefined) delete values[key];
  });
  return {
    recordId,
    attributes: values,
    provenance
  };
}

// CurrentSubmissionContext shape, civil date, operational provenance and freezing.
const mutableInput = {
  processId: 'TEST_ONLY_TECHNICAL_PROCESS',
  protocolIdentifier: protocol,
  requestDate: '2026-01-28',
  reIdentifier: 'TEST_ONLY_RE_1',
  provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_REF' }
};
const frozenContext = api.createCurrentSubmissionContext(mutableInput);
assert.equal(frozenContext.protocolIdentifier, protocol);
assert.equal(frozenContext.requestDate, '2026-01-28');
assert.equal(Object.isFrozen(frozenContext), true);
assert.equal(Object.isFrozen(frozenContext.provenance), true);
mutableInput.protocolIdentifier = 'TEST_ONLY_MUTATED';
mutableInput.provenance.sourceReference = 'TEST_ONLY_MUTATED';
assert.equal(frozenContext.protocolIdentifier, protocol);
assert.equal(frozenContext.provenance.sourceReference, 'TEST_ONLY_REF');

for (const invalid of [
  { protocolIdentifier: undefined },
  { requestDate: undefined },
  { requestDate: '2025-02-29' },
  { requestDate: '2024-02-30' },
  { requestDate: '0000-01-01' },
  { requestDate: '2024-02-29T00:00:00Z' },
  { provenance: undefined },
  { provenance: { sourceKind: 'TEST_ONLY' } }
]) {
  assertBlocker(() => operationalContext(invalid));
}
assert.equal(api.createCurrentSubmissionContext({
  protocolIdentifier: protocol,
  requestDate: '2024-02-29',
  provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_REF' }
}).requestDate, '2024-02-29');
assertBlocker(() => api.createCurrentSubmissionContext({
  processId: 'TEST_ONLY_TECHNICAL_PROCESS',
  protocolIdentifier: '', requestDate: '2026-01-28',
  provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_REF' }
}));

// Exact protocol + civil request date selects; processId never substitutes.
assert.equal(selectId([matching()]), 'TEST_ONLY_CURRENT');
assertBlocker(() => selectId([{
  recordId: 'TEST_ONLY_PROCESS_ID_ONLY',
  attributes: { REQUEST_DATE: '2026-01-28' }
}]));
assertBlocker(() => selectId([{
  recordId: 'TEST_ONLY_REQUEST_IDENTIFIER_ONLY',
  attributes: { REQUEST_IDENTIFIER: protocol, RE_IDENTIFIER: 'TEST_ONLY_RE_1' }
}]));
assert.equal(selectId([matching('TEST_ONLY_DIFFERENT_TECHNICAL_ID')]),
  'TEST_ONLY_DIFFERENT_TECHNICAL_ID');
assert.equal(selectId([matching('TEST_ONLY_LEGACY_REQUEST_IDENTIFIER', {
  REQUEST_IDENTIFIER: 'TEST_ONLY_DIFFERENT'
})]), 'TEST_ONLY_LEGACY_REQUEST_IDENTIFIER');
assert.equal(selectId([matching('TEST_ONLY_DATE_NOT_MAPPED_TO_REQUEST_IDENTIFIER', {
  REQUEST_IDENTIFIER: '2026-01-28'
})]), 'TEST_ONLY_DATE_NOT_MAPPED_TO_REQUEST_IDENTIFIER');

// The same protocol with an earlier/later submission date is another presentation.
assertBlocker(() => selectId([matching('TEST_ONLY_EARLIER', { REQUEST_DATE: '2025-12-01' })]));
assertBlocker(() => selectId([matching('TEST_ONLY_LATER', { REQUEST_DATE: '2026-01-29' })]));
assertBlocker(() => selectId([matching('TEST_ONLY_OTHER_PROTOCOL', {
  PROTOCOL_IDENTIFIER: 'TEST_ONLY_OTHER_PROTOCOL'
})]));
assertBlocker(() => selectId([matching('TEST_ONLY_SAME_RE_OLD_DATE', {
  REQUEST_DATE: '2025-12-01', RE_IDENTIFIER: 'TEST_ONLY_RE_1'
})]));

// RE is a consistency check only when both sides supply it; it cannot identify.
assertBlocker(() => selectId([matching('TEST_ONLY_RE_MISMATCH', {
  RE_IDENTIFIER: 'TEST_ONLY_OTHER_RE'
})]));
assert.equal(selectId([matching('TEST_ONLY_RE_ABSENT', {
  RE_IDENTIFIER: undefined
})]), 'TEST_ONLY_RE_ABSENT');
assert.equal(selectId([matching('TEST_ONLY_CONTEXT_RE_ABSENT')],
  operationalContext({ reIdentifier: null })), 'TEST_ONLY_CONTEXT_RE_ABSENT');
assert.equal(selectId([
  matching('TEST_ONLY_BAD_RE', { RE_IDENTIFIER: 'TEST_ONLY_OTHER_RE' }),
  matching('TEST_ONLY_GOOD_RE')
]), 'TEST_ONLY_GOOD_RE');

// Zero and duplicate exact matches block; no tie-breaker is applied.
assertBlocker(() => selectId([]));
assertBlocker(() => api.selectCurrentComprovante({}, operationalContext()));
const duckTypedView = {
  referencesByEntity() { return [new api.TypedReference('DOCUMENT', 'TEST_ONLY_FAKE')]; },
  entityId() { return 'COMPROVANTE_DE_SOLICITACAO_DE_HABITESE'; },
  read() { return { PROTOCOL_IDENTIFIER: protocol, REQUEST_DATE: '2026-01-28' }; },
  sourceDocument(reference) { return reference; }
};
assertBlocker(() => api.selectCurrentComprovante(duckTypedView, operationalContext()));
const forgedView = Object.create(api.ImmutableExecutionView.prototype);
Object.defineProperties(forgedView, {
  referencesByEntity: { value: duckTypedView.referencesByEntity, enumerable: true },
  entityId: { value: duckTypedView.entityId, enumerable: true },
  read: { value: duckTypedView.read, enumerable: true },
  sourceDocument: { value: duckTypedView.sourceDocument, enumerable: true }
});
assertBlocker(() => api.selectCurrentComprovante(forgedView, operationalContext()));
assertBlocker(() => selectId([
  matching('TEST_ONLY_DUPLICATE_A'), matching('TEST_ONLY_DUPLICATE_B')
]));

// Filename, timestamps, record identity and attachment ordering do not select.
const distractor = matching('TEST_ONLY_DISTRACTOR', {
  PROTOCOL_IDENTIFIER: 'TEST_ONLY_OTHER_PROTOCOL', REQUEST_DATE: '2026-01-28'
}, { filename: 'same.pdf', created_at: '2099-01-01T00:00:00Z' });
const targetA = matching('TEST_ONLY_TARGET_A', {}, {
  filename: 'old.pdf', created_at: '2000-01-01T00:00:00Z'
});
const targetB = matching('TEST_ONLY_TARGET_B', {}, {
  filename: 'same.pdf', created_at: '2099-01-01T00:00:00Z'
});
assertBlocker(() => selectId([distractor]));
assert.equal(selectId([distractor, targetA]), 'TEST_ONLY_TARGET_A');
assert.equal(selectId([targetB, distractor]), 'TEST_ONLY_TARGET_B');
assertBlocker(() => selectId([targetB, targetA]));

// Re-presentation scenario: protocol is shared; REQUEST_DATE chooses only B.
const submissionFixture = api.createCurrentSubmissionContext({
  processId: 'TEST_ONLY_PIPELINE_PROCESS',
  protocolIdentifier: 'H8089007743A',
  requestDate: '2026-01-28',
  provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_INTAKE' }
});
const presentationA = {
  recordId: 'TEST_ONLY_PRESENTATION_A',
  attributes: { PROTOCOL_IDENTIFIER: 'H8089007743A', REQUEST_DATE: '2025-12-01' }
};
const presentationB = {
  recordId: 'TEST_ONLY_PRESENTATION_B',
  attributes: { PROTOCOL_IDENTIFIER: 'H8089007743A', REQUEST_DATE: '2026-01-28' }
};
assert.equal(selectId([presentationA, presentationB], submissionFixture),
  'TEST_ONLY_PRESENTATION_B');

// Independent invocations do not share submission state or consult prior results.
const invocationA = api.createCurrentSubmissionContext({
  protocolIdentifier: 'TEST_ONLY_REPEATED_PROTOCOL',
  requestDate: '2026-01-10',
  provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_INTAKE_A' }
});
const invocationB = api.createCurrentSubmissionContext({
  protocolIdentifier: 'TEST_ONLY_REPEATED_PROTOCOL',
  requestDate: '2026-01-28',
  provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_INTAKE_B' }
});
const independentSubmissions = [
  matching('TEST_ONLY_SUBMISSION_A', {
    PROTOCOL_IDENTIFIER: invocationA.protocolIdentifier,
    REQUEST_DATE: invocationA.requestDate
  }),
  matching('TEST_ONLY_SUBMISSION_B', {
    PROTOCOL_IDENTIFIER: invocationB.protocolIdentifier,
    REQUEST_DATE: invocationB.requestDate
  })
];
assert.equal(selectId(independentSubmissions, invocationA), 'TEST_ONLY_SUBMISSION_A');
assert.equal(selectId(independentSubmissions, invocationB), 'TEST_ONLY_SUBMISSION_B');
assert.equal(selectId(independentSubmissions.slice().reverse(), invocationB),
  'TEST_ONLY_SUBMISSION_B');
assert.equal(selectId(independentSubmissions, {
  ...invocationB,
  processId: 'TEST_ONLY_DIFFERENT_CORRELATION_ID'
}), 'TEST_ONLY_SUBMISSION_B');

console.log('apps-script-current-submission-context: PASS');
