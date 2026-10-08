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
  '../apps-script/CurrentSubmissionContextCore.js',
  '../apps-script/CbmscApplicabilityCore.js',
  '../apps-script/ExecutionPlanCore.js',
  '../apps-script/CriterionExecutionCore.js',
  '../apps-script/ValidatedExecutionReadinessCore.js',
]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, relativePath), 'utf8'), context);
}
vm.runInContext(
  'globalThis.api = {' +
  'COMPILED_RUNTIME_CONTRACT,' +
  'prepareValidatedExecutionReadiness,' +
  'ValidatedExecutionReadinessError' +
  '};',
  context
);
const api = context.api;

const processRecord = {
  processId: 'TEST_ONLY_PROCESS',
  sourceFileId: 'TEST_ONLY_SOURCE',
  status: 'VALIDATED',
  rdeVersion: '0.2.0',
};

function rdeFixture() {
  return {
    schema_version: '0.2.0',
    process_id: processRecord.processId,
    source: {
      file_id: processRecord.sourceFileId,
      file_name: 'TEST_ONLY.pdf',
      mime_type: 'application/pdf',
      source_url: 'TEST_ONLY_SOURCE_URL',
      sha256: 'a'.repeat(64),
    },
    extraction: {
      provider: 'TEST_ONLY',
      extractor_version: 'TEST_ONLY',
      created_at: '2026-01-28T12:00:00.000Z',
    },
    records: [
      {
        record_id: 'DOC_CURRENT',
        entity_id: 'COMPROVANTE_DE_SOLICITACAO_DE_HABITESE',
        parent_record_id: null,
        source_document: 'DOC_CURRENT',
        attributes: {
          PROTOCOL_IDENTIFIER: 'TEST_ONLY_PROTOCOL',
          REQUEST_DATE: '2026-01-28',
          RE_IDENTIFIER: 'TEST_ONLY_RE',
        },
        provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_DOCUMENT' },
      },
      {
        record_id: 'SECTION_CURRENT',
        entity_id: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA',
        parent_record_id: 'DOC_CURRENT',
        source_document: 'DOC_CURRENT',
        attributes: { STRUCTURALLY_COMPLETE: true, LEGIBLE: true, VERIFIABLE: true },
        provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_SECTION' },
      },
      {
        record_id: 'ITEM_GAS',
        entity_id: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA_ITEM',
        parent_record_id: 'SECTION_CURRENT',
        source_document: 'DOC_CURRENT',
        attributes: {
          OFFICIAL_ESCI_CODE: 'IGC',
          PRESENTED_SYSTEM_MEASURE_DESCRIPTION: 'TEST_ONLY gas system',
          RPCI_ORIENTATIVE_TEXT: 'TEST_ONLY',
          SOURCE_LOCATION: 'TEST_ONLY page 1',
        },
        provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_GAS_ITEM' },
      },
      {
        record_id: 'DOC_MANUAL',
        entity_id: 'MANUAL',
        parent_record_id: null,
        source_document: 'DOC_MANUAL',
        attributes: {},
        provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_MANUAL' },
      },
      {
        record_id: 'MANUAL_CLASSIFICATION',
        entity_id: 'GAS_OWNER_MANUAL',
        parent_record_id: null,
        source_document: 'DOC_MANUAL',
        attributes: {},
        provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_MANUAL_CLASSIFICATION' },
      },
    ],
    extraction_warnings: [],
  };
}

function currentSubmissionContext(requestDate = '2026-01-28') {
  return {
    protocolIdentifier: 'TEST_ONLY_PROTOCOL',
    requestDate,
    reIdentifier: 'TEST_ONLY_RE',
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_INTAKE' },
  };
}

function makeAdapters({ status = 'VALIDATED', content = JSON.stringify(rdeFixture()) } = {}) {
  const counts = {
    locks: 0,
    processReads: 0,
    rdeReads: 0,
    writes: 0,
    documentSourceReads: 0,
    executionCalls: 0,
  };
  return {
    counts,
    adapters: {
      withLock(callback) {
        counts.locks += 1;
        return callback();
      },
      readProcess(processId) {
        counts.processReads += 1;
        return processId === processRecord.processId
          ? { ...processRecord, status }
          : null;
      },
      readValidatedRde() {
        counts.rdeReads += 1;
        return content;
      },
      write() { counts.writes += 1; throw new Error('readiness must not write'); },
      readSourceDocument() { counts.documentSourceReads += 1; throw new Error('source read forbidden'); },
      executeCriterion() { counts.executionCalls += 1; throw new Error('execution is deferred'); },
    },
  };
}

const fixtureContent = JSON.stringify(rdeFixture());
const happyAdapters = makeAdapters({ content: fixtureContent });
const prepared = api.prepareValidatedExecutionReadiness(
  processRecord.processId, currentSubmissionContext(), happyAdapters.adapters
);
assert.equal(prepared.outcome, 'EXECUTION_COVERAGE_INCOMPLETE');
assert.equal(prepared.workflowStatus, 'VALIDATED');
assert.equal(prepared.analysisPermitted, false);
assert.equal(prepared.resultRecordsCreated, 0);
assert.equal(prepared.artifactsPersisted, false);
assert.equal(prepared.rdeMutated, false);
assert.ok(prepared.coverage.plannedUnitKeys.includes(
  'UNIT_KEY (REQ_IN08_MANUAL, T4_IN08_MANUAL)'
));
assert.ok(prepared.coverage.materializableUnitKeys.includes(
  'UNIT_KEY (REQ_IN08_MANUAL, T4_IN08_MANUAL)'
));
assert.ok(prepared.coverage.plannedUnitKeys.includes(
  'UNIT_KEY (REQ_IN19_APPLICABILITY_REVIEW, T4_IN19_APPLICABILITY_REVIEW)'
));
assert.ok(prepared.coverage.materializableUnitKeys.includes(
  'UNIT_KEY (REQ_IN19_APPLICABILITY_REVIEW, T4_IN19_APPLICABILITY_REVIEW)'
));
assert.ok(prepared.coverage.unsupportedUnitKeys.includes(
  'UNIT_KEY (REQ_T1_DRT_REQUIRED, T1_DRT_REQUIRED)'
));
assert.ok(prepared.coverage.materializableUnitKeys.includes(
  'UNIT_KEY (REQ_T1_CONFORMITY_REPORT_SIGNED, T1_CONFORMITY_REPORT_SIGNED)'
));
assert.ok(prepared.coverage.unsupportedUnitKeys.includes(
  'UNIT_KEY (REQ_IN08_ESTANQUEIDADE, T4_IN08_ESTANQUEIDADE)'
));
assert.equal(happyAdapters.counts.locks, 1);
assert.equal(happyAdapters.counts.processReads, 1);
assert.equal(happyAdapters.counts.rdeReads, 1);
assert.equal(happyAdapters.counts.writes, 0);
assert.equal(happyAdapters.counts.documentSourceReads, 0);

function readinessForSignedSystemProduct(officialEsciCode, productEntityId) {
  const rde = rdeFixture();
  rde.records.push({
    record_id: 'ITEM_SIGNED_SYSTEM',
    entity_id: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA_ITEM',
    parent_record_id: 'SECTION_CURRENT', source_document: 'DOC_CURRENT',
    attributes: {
      OFFICIAL_ESCI_CODE: officialEsciCode,
      PRESENTED_SYSTEM_MEASURE_DESCRIPTION: 'TEST_ONLY signed product system',
      RPCI_ORIENTATIVE_TEXT: 'TEST_ONLY', SOURCE_LOCATION: 'TEST_ONLY page 3',
    },
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_SIGNED_SYSTEM' },
  });
  const productId = 'SIGNED_PRODUCT';
  const isDocument = api.COMPILED_RUNTIME_CONTRACT.entityCatalog[productEntityId].TYPE === 'DOCUMENT';
  const sourceDocumentId = isDocument ? productId : 'DOC_SIGNED_PRODUCT';
  if (!isDocument) {
    rde.records.push({
      record_id: sourceDocumentId, entity_id: 'PPCI', parent_record_id: null,
      source_document: sourceDocumentId, attributes: {},
      provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'SIGNED_PRODUCT_SOURCE' },
    });
  }
  rde.records.push({
    record_id: productId, entity_id: productEntityId, parent_record_id: null,
    source_document: sourceDocumentId,
    attributes: { SIGNATURE_MECHANISM: 'TEST_ONLY explicitly stated mechanism' },
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'SIGNED_PRODUCT_FACT' },
  });
  const adapters = makeAdapters({ content: JSON.stringify(rde) });
  const result = api.prepareValidatedExecutionReadiness(
    processRecord.processId, currentSubmissionContext(), adapters.adapters
  );
  return { result, adapters };
}

for (const signedReadinessCase of [
  {
    officialEsciCode: 'SHP', productEntityId: 'SHP_COMMISSIONING_REPORT',
    unitKey: 'UNIT_KEY (REQ_IN07_COMMISSIONING, T4_IN07_COMMISSIONING)',
  },
  {
    officialEsciCode: 'SPDE', productEntityId: 'PRESSURIZATION_MAINTENANCE_CHECKLIST',
    unitKey: 'UNIT_KEY (REQ_IN09_CHECKLIST, T4_IN09_CHECKLIST)',
  },
  {
    officialEsciCode: 'CMAR', productEntityId: 'CMAR_DECLARATION',
    unitKey: 'UNIT_KEY (REQ_IN18_CMAR, T4_IN18_CMAR)',
  },
]) {
  const { result, adapters } = readinessForSignedSystemProduct(
    signedReadinessCase.officialEsciCode, signedReadinessCase.productEntityId
  );
  assert.equal(result.outcome, 'EXECUTION_COVERAGE_INCOMPLETE');
  assert.ok(result.coverage.plannedUnitKeys.includes(signedReadinessCase.unitKey));
  if (signedReadinessCase.officialEsciCode === 'SPDE') {
    assert.ok(result.coverage.unsupportedUnitKeys.includes(
      'UNIT_KEY (REQ_IN09_TEST_REPORT, T4_IN09_TEST_REPORT)'
    ));
  }
  if (signedReadinessCase.officialEsciCode === 'SHP') {
    assert.ok(result.coverage.unsupportedUnitKeys.includes(signedReadinessCase.unitKey),
      'ALL must remain unsupported when a child predicate lacks an executor');
    assert.ok(!result.coverage.materializableUnitKeys.includes(signedReadinessCase.unitKey));
  } else {
    assert.ok(result.coverage.materializableUnitKeys.includes(signedReadinessCase.unitKey));
  }
  assert.equal(result.workflowStatus, 'VALIDATED');
  assert.equal(result.analysisPermitted, false);
  assert.equal(result.resultRecordsCreated, 0);
  assert.equal(result.artifactsPersisted, false);
  assert.equal(result.rdeMutated, false);
  assert.equal(adapters.counts.writes, 0);
  assert.equal(adapters.counts.executionCalls, 0);
  assert.equal(adapters.counts.documentSourceReads, 0);
}
assert.equal(happyAdapters.counts.executionCalls, 0);

const legacyReadinessRde = rdeFixture();
legacyReadinessRde.records[0].attributes.REQUEST_DATE = '2024-04-24';
legacyReadinessRde.records.push({
  record_id: 'ITEM_IEL', entity_id: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA_ITEM',
  parent_record_id: 'SECTION_CURRENT', source_document: 'DOC_CURRENT',
  attributes: {
    OFFICIAL_ESCI_CODE: 'IEL',
    PRESENTED_SYSTEM_MEASURE_DESCRIPTION: 'TEST_ONLY low-voltage installation',
    RPCI_ORIENTATIVE_TEXT: 'TEST_ONLY', SOURCE_LOCATION: 'TEST_ONLY page 2',
  },
  provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_IEL_ITEM' },
});
const legacyReadinessAdapters = makeAdapters({ content: JSON.stringify(legacyReadinessRde) });
const legacyReadiness = api.prepareValidatedExecutionReadiness(
  processRecord.processId, currentSubmissionContext('2024-04-24'),
  legacyReadinessAdapters.adapters
);
assert.ok(legacyReadiness.coverage.plannedUnitKeys.includes(
  'UNIT_KEY (REQ_IN19_LEGACY_DOCUMENTATION, T4_IN19_LEGACY_DOCUMENTATION)'
));
assert.ok(legacyReadiness.coverage.materializableUnitKeys.includes(
  'UNIT_KEY (REQ_IN19_LEGACY_DOCUMENTATION, T4_IN19_LEGACY_DOCUMENTATION)'
));
assert.equal(legacyReadiness.workflowStatus, 'VALIDATED');
assert.equal(legacyReadiness.analysisPermitted, false);
assert.equal(legacyReadinessAdapters.counts.writes, 0);
assert.equal(legacyReadinessAdapters.counts.executionCalls, 0);
assert.equal(legacyReadinessAdapters.counts.documentSourceReads, 0);
assert.equal(fixtureContent, JSON.stringify(rdeFixture()));
assert.equal(Object.isFrozen(prepared), true);
assert.equal(Object.isFrozen(prepared.coverage.unsupportedUnitKeys), true);

const repeated = api.prepareValidatedExecutionReadiness(
  processRecord.processId, currentSubmissionContext(), happyAdapters.adapters
);
assert.deepEqual(JSON.parse(JSON.stringify(repeated)), JSON.parse(JSON.stringify(prepared)));
assert.equal(happyAdapters.counts.writes, 0);
assert.equal(happyAdapters.counts.executionCalls, 0);

const viewPrototype = vm.runInContext('ImmutableExecutionView.prototype', context);
const originalReferencesByEntity = viewPrototype.referencesByEntity;
viewPrototype.referencesByEntity = function (entityId) {
  if (entityId === 'GAS_OWNER_MANUAL') return {};
  return originalReferencesByEntity.call(this, entityId);
};
const integrityFailureAdapters = makeAdapters();
try {
  assert.throws(() => api.prepareValidatedExecutionReadiness(
    processRecord.processId, currentSubmissionContext(), integrityFailureAdapters.adapters
  ), error => error && error.code === 'CRITERION_EXECUTION_INTEGRITY_ERROR' &&
    /invalid entity reference collection/.test(error.message));
} finally {
  viewPrototype.referencesByEntity = originalReferencesByEntity;
}
assert.equal(integrityFailureAdapters.counts.writes, 0);
assert.equal(integrityFailureAdapters.counts.executionCalls, 0);

const analyzedAdapters = makeAdapters({ status: 'ANALYZED' });
const alreadyAnalyzed = api.prepareValidatedExecutionReadiness(
  processRecord.processId, currentSubmissionContext(), analyzedAdapters.adapters
);
assert.equal(alreadyAnalyzed.outcome, 'ALREADY_ANALYZED');
assert.equal(alreadyAnalyzed.workflowStatus, 'ANALYZED');
assert.equal(analyzedAdapters.counts.rdeReads, 0);
assert.equal(analyzedAdapters.counts.executionCalls, 0);

const wrongStatusAdapters = makeAdapters({ status: 'EXTRACTED' });
assert.throws(() => api.prepareValidatedExecutionReadiness(
  processRecord.processId, currentSubmissionContext(), wrongStatusAdapters.adapters
), error => error && error.code === 'PROCESS_STATUS_NOT_VALIDATED');
assert.equal(wrongStatusAdapters.counts.rdeReads, 0);

const missingRdeAdapters = makeAdapters({ content: '' });
assert.throws(() => api.prepareValidatedExecutionReadiness(
  processRecord.processId, currentSubmissionContext(), missingRdeAdapters.adapters
), error => error && error.code === 'RDE_MISSING');
assert.equal(missingRdeAdapters.counts.writes, 0);

const invalidRde = rdeFixture();
invalidRde.schema_version = '0.1.0';
const invalidRdeAdapters = makeAdapters({ content: JSON.stringify(invalidRde) });
assert.throws(() => api.prepareValidatedExecutionReadiness(
  processRecord.processId, currentSubmissionContext(), invalidRdeAdapters.adapters
), error => error && error.code === 'RDE_INVALID');
assert.equal(invalidRdeAdapters.counts.writes, 0);

const mismatchedVersionAdapters = makeAdapters();
const originalReadProcess = mismatchedVersionAdapters.adapters.readProcess;
mismatchedVersionAdapters.adapters.readProcess = processId => ({
  ...originalReadProcess(processId), rdeVersion: '0.3.0'
});
assert.throws(() => api.prepareValidatedExecutionReadiness(
  processRecord.processId, currentSubmissionContext(), mismatchedVersionAdapters.adapters
), error => error && error.code === 'RDE_VERSION_MISMATCH');
assert.equal(mismatchedVersionAdapters.counts.rdeReads, 1);

const invalidContextAdapters = makeAdapters();
assert.throws(() => api.prepareValidatedExecutionReadiness(
  processRecord.processId,
  { ...currentSubmissionContext(), requestDate: '2026-02-30' },
  invalidContextAdapters.adapters
), error => error && error.code === 'ARCHITECTURAL_BLOCKER');
assert.equal(invalidContextAdapters.counts.writes, 0);
assert.equal(invalidContextAdapters.counts.executionCalls, 0);

const duplicateContextAdapters = makeAdapters();
assert.throws(() => api.prepareValidatedExecutionReadiness(
  processRecord.processId,
  { ...currentSubmissionContext(), protocolIdentifier: 'TEST_ONLY_OTHER_PROTOCOL' },
  duplicateContextAdapters.adapters
), error => error && error.code === 'ARCHITECTURAL_BLOCKER');
assert.equal(duplicateContextAdapters.counts.writes, 0);

const appScriptCounters = { lock: 0, release: 0, writes: 0, sourceReads: 0 };
const appScriptRegistryRow = [
  processRecord.processId, processRecord.sourceFileId, 'TEST_ONLY.pdf',
  'application/pdf', 10, 'TEST_ONLY_SOURCE_URL', 'VALIDATED', new Date(0),
  new Date(0), new Date(0), new Date(0), '0.5.0', '0.2.0', '',
];
const appScriptSheet = {
  getLastRow() { return 2; },
  getRange(row, column, numRows, numColumns) {
    return {
      getValues() {
        if (row === 1) return [[
          'PROCESS_ID', 'SOURCE_FILE_ID', 'SOURCE_FILE_NAME', 'MIME_TYPE',
          'SIZE_BYTES', 'SOURCE_URL', 'STATUS', 'CREATED_AT', 'UPDATED_AT',
          'SOURCE_CREATED_AT', 'SOURCE_UPDATED_AT', 'ENGINE_VERSION',
          'RDE_VERSION', 'ERROR',
        ]];
        assert.equal(row, 2);
        assert.equal(column, 1);
        assert.equal(numRows, 1);
        assert.equal(numColumns, 14);
        return [appScriptRegistryRow];
      },
      setValue() { appScriptCounters.writes += 1; throw new Error('write forbidden'); },
      setValues() { appScriptCounters.writes += 1; throw new Error('write forbidden'); },
    };
  },
};
const appScriptSpreadsheet = { getSheetByName() { return appScriptSheet; } };
function iterator(items) {
  let index = 0;
  return {
    hasNext() { return index < items.length; },
    next() { return items[index++]; },
  };
}
const appScriptRdeFile = {
  getBlob() { return { getDataAsString() { return fixtureContent; } }; },
};
const appScriptRdeFolder = {
  getFilesByName(name) {
    assert.equal(name, 'rde-v0.2.0.json');
    return iterator([appScriptRdeFile]);
  }
};
const appScriptProcessFolder = {
  getFoldersByName(name) {
    return iterator(name === 'RDE' ? [appScriptRdeFolder] : []);
  },
};
const appScriptProcessingRoot = {
  getFoldersByName(name) {
    return iterator(name === processRecord.processId ? [appScriptProcessFolder] : []);
  },
};
context.LockService = {
  getScriptLock() {
    return {
      waitLock() { appScriptCounters.lock += 1; },
      releaseLock() { appScriptCounters.release += 1; },
    };
  },
};
context.PropertiesService = {
  getScriptProperties() { return { getProperty() { return 'TEST_ONLY_REGISTRY'; } }; },
};
context.SpreadsheetApp = { openById() { return appScriptSpreadsheet; } };
context.DriveApp = {
  getFolderById() { return appScriptProcessingRoot; },
  getFileById() { appScriptCounters.sourceReads += 1; throw new Error('source read forbidden'); },
};
vm.runInContext(fs.readFileSync(path.join(__dirname, '../apps-script/Code.gs'), 'utf8'), context);
const appsScriptPrepared = context.prepareValidatedProcessExecutionReadiness(
  processRecord.processId, currentSubmissionContext()
);
assert.equal(appsScriptPrepared.outcome, 'EXECUTION_COVERAGE_INCOMPLETE');
assert.equal(appsScriptPrepared.workflowStatus, 'VALIDATED');
assert.equal(appScriptCounters.lock, 1);
assert.equal(appScriptCounters.release, 1);
assert.equal(appScriptCounters.writes, 0);
assert.equal(appScriptCounters.sourceReads, 0);

const coreSource = fs.readFileSync(
  path.join(__dirname, '../apps-script/ValidatedExecutionReadinessCore.js'), 'utf8'
);
for (const forbidden of [
  'DriveApp', 'SpreadsheetApp', 'PropertiesService', 'UrlFetchApp',
  'Gemini', 'OpenAI', 'getFileById', 'getBlob', 'readSourceDocument',
  'setValue', 'setValues', 'ANALYZED =',
]) assert.equal(coreSource.includes(forbidden), false);

console.log('apps-script-validated-execution-readiness: PASS');
