const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = { console: { log() {} } };
vm.createContext(context);
for (const relativePath of [
  '../apps-script/CompiledRuntimeContract.js',
  '../apps-script/RdeCore.js',
  '../apps-script/Code.gs',
]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, relativePath), 'utf8'), context);
}

const sourceBytes = Buffer.from('test-only submitted PDF bytes', 'utf8');
const sourceDigest = crypto.createHash('sha256').update(sourceBytes).digest('hex');
const processId = 'TEST_ONLY_PROCESS';
const sourceFileId = 'TEST_ONLY_SOURCE_FILE';
const rdeFileId = 'TEST_ONLY_RDE_FILE';
const rdeVersion = vm.runInContext('RDE_SCHEMA_VERSION', context);
const rde = context.buildFakeRde_({
  processId,
  sourceFileId,
  sourceFileName: 'TEST_ONLY.pdf',
  sourceMimeType: 'application/pdf',
  sourceUrl: 'TEST_ONLY_SOURCE_URL',
  sourceSha256: sourceDigest,
  createdAt: '2026-10-21T12:00:00.000Z',
});
const rdeContent = JSON.stringify(rde, null, 2);

context.Utilities = {
  DigestAlgorithm: { SHA_256: 'SHA_256' },
  Charset: { UTF_8: 'UTF_8' },
  computeDigest(_algorithm, value) {
    const bytes = typeof value === 'string' ? Buffer.from(value, 'utf8') : Buffer.from(value);
    return [...crypto.createHash('sha256').update(bytes).digest()].map(byte =>
      byte > 127 ? byte - 256 : byte);
  },
  newBlob(value) {
    const bytes = Buffer.from(value, 'utf8');
    return { getBytes() { return [...bytes].map(byte => byte > 127 ? byte - 256 : byte); } };
  },
};

function iterator(items) {
  let index = 0;
  return {
    hasNext() { return index < items.length; },
    next() { return items[index++]; },
  };
}

const headers = [
  'PROCESS_ID', 'SOURCE_FILE_ID', 'SOURCE_FILE_NAME', 'MIME_TYPE', 'SIZE_BYTES',
  'SOURCE_URL', 'STATUS', 'CREATED_AT', 'UPDATED_AT', 'SOURCE_CREATED_AT',
  'SOURCE_UPDATED_AT', 'ENGINE_VERSION', 'RDE_VERSION', 'VALIDATED_RDE_FILE_ID',
  'VALIDATED_RDE_DIGEST', 'ERROR',
];
const registryRow = [
  processId, sourceFileId, 'TEST_ONLY.pdf', 'application/pdf', sourceBytes.length,
  'TEST_ONLY_SOURCE_URL', 'EXTRACTED', new Date(0), new Date(0), new Date(0),
  new Date(0), 'TEST_ONLY_ENGINE', rdeVersion, '', '', '',
];
let updateCount = 0;
const sheet = {
  getName() { return 'PROCESSOS'; },
  getLastRow() { return 2; },
  getLastColumn() { return headers.length; },
  getRange(row, column, numRows, numColumns) {
    return {
      getValues() {
        if (row === 1) return [headers];
        assert.deepEqual([row, column, numRows, numColumns], [2, 1, 1, headers.length]);
        return [registryRow.slice()];
      },
      setValues(values) {
        assert.deepEqual([row, column, numRows, numColumns], [2, 7, 1, 10]);
        assert.equal(values.length, 1);
        registryRow.splice(6, 10, ...values[0]);
        updateCount += 1;
      },
    };
  },
};
const spreadsheet = {
  getId() { return 'TEST_ONLY_REGISTRY'; },
  getSheetByName() { return sheet; },
  getSheets() { return [sheet]; },
};
const sourceFile = {
  getId() { return sourceFileId; },
  getBlob() { return { getBytes() { return [...sourceBytes].map(byte => byte > 127 ? byte - 256 : byte); } }; },
};
const rdeFile = {
  getId() { return rdeFileId; },
  getMimeType() { return 'application/json'; },
  getBlob() { return { getDataAsString() { return rdeContent; } }; },
};
const rdeFolder = { getFilesByName(name) {
  assert.equal(name, 'rde-v' + rdeVersion + '.json');
  return iterator([rdeFile]);
} };
const processFolder = { getFoldersByName(name) {
  return iterator(name === 'RDE' ? [rdeFolder] : []);
} };
const processingRoot = { getFoldersByName(name) {
  return iterator(name === processId ? [processFolder] : []);
} };
const configFolder = { getFilesByName() { return iterator([]); } };

context.LockService = { getScriptLock() {
  return { waitLock() {}, releaseLock() {} };
} };
context.PropertiesService = { getScriptProperties() {
  return {
    getProperty() { return 'TEST_ONLY_REGISTRY'; },
    setProperty() {},
  };
} };
context.SpreadsheetApp = {
  openById() { return spreadsheet; },
  flush() {},
};
context.DriveApp = {
  getFolderById() { return processingRoot; },
  getFileById(id) {
    assert.equal(id, sourceFileId);
    return sourceFile;
  },
};

const result = context.validateExtractedProcesses();
assert.equal(result.validated, 1, JSON.stringify(result));
assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
assert.equal(updateCount, 1);
assert.equal(registryRow[6], 'VALIDATED');
assert.equal(registryRow[13], rdeFileId);
assert.match(registryRow[14], /^[0-9a-f]{64}$/);
assert.equal(registryRow[15], '');
const parsed = context.parseAndValidateOperationalRdeJson_(rdeContent, {
  processId,
  sourceFileId,
}, context.COMPILED_RUNTIME_CONTRACT.entityCatalog);
assert.equal(registryRow[14], context.getValidatedRdeDigest_(parsed));

console.log('apps-script-rde-validation-snapshot: PASS');
