const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const corePath = path.join(__dirname, '..', 'apps-script', 'RdeCore.js');
const source = fs.readFileSync(corePath, 'utf8');
const context = {
  Utilities: {
    DigestAlgorithm: { SHA_256: 'SHA-256' },
    computeDigest(algorithm, bytes) {
      assert.equal(algorithm, 'SHA-256');
      return Array.from(crypto.createHash('sha256').update(Buffer.from(bytes)).digest());
    }
  }
};

vm.createContext(context);
vm.runInContext(source + `
  globalThis.rdeCore = {
    RDE_SCHEMA_VERSION,
    buildFakeRde_,
    validateRde_,
    parseAndValidateRdeJson_,
    sha256Hex_,
  validateRdeStructure_,
  validateRdeRecordEnvelope_,
    parseAndValidateOperationalRdeJson_,
    validateSourceHash_
  };
`, context);

const core = context.rdeCore;
const input = {
  processId: 'HAB-E30DD583092F3F62',
  sourceFileId: 'source-file-123',
  sourceFileName: 'teste.pdf',
  sourceMimeType: 'application/pdf',
  sourceUrl: 'https://drive.google.com/file/d/source-file-123/view',
  sourceSha256: 'a'.repeat(64),
  createdAt: '2026-10-05T12:00:00.000Z'
};
const expected = {
  processId: input.processId,
  sourceFileId: input.sourceFileId,
  sourceSha256: input.sourceSha256
};

assert.equal(core.RDE_SCHEMA_VERSION, '0.2.0');
assert.equal(
  core.sha256Hex_(Array.from(Buffer.from('abc'))),
  'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
);

const rde = core.buildFakeRde_(input);
assert.equal(rde.schema_version, '0.2.0');
assert.equal(rde.process_id, input.processId);
assert.equal(rde.source.file_id, input.sourceFileId);
assert.equal(rde.source.sha256, input.sourceSha256);
assert.equal(rde.extraction.provider, 'FAKE_DETERMINISTIC');
assert.deepEqual(JSON.parse(JSON.stringify(rde.records)), []);

const existingJson = JSON.stringify(rde, null, 2);
const originalExistingJson = existingJson;
assert.equal(
  core.parseAndValidateRdeJson_(existingJson, expected).process_id,
  input.processId
);
assert.equal(existingJson, originalExistingJson);

const differentTimestamp = JSON.parse(existingJson);
differentTimestamp.extraction.created_at = '2025-01-01T00:00:00.000Z';
assert.doesNotThrow(() => core.validateRde_(differentTimestamp, expected));

assert.throws(
  () => core.validateRde_(rde, { ...expected, processId: 'HAB-OTHER' }),
  /PROCESS_ID da RDE incompatível/
);
assert.throws(
  () => core.validateRde_(rde, { ...expected, sourceFileId: 'other-file' }),
  /SOURCE_FILE_ID da RDE incompatível/
);
assert.throws(
  () => core.validateRde_({ ...rde, schema_version: '9.9.9' }, expected),
  /RDE_SCHEMA_VERSION incompatível/
);
assert.throws(
  () => core.validateRde_({ ...rde, conclusion: 'PASS' }, expected),
  /RDE deve ser um objeto JSON/
);
assert.throws(
  () => core.parseAndValidateRdeJson_('{inválido', expected),
  /JSON da RDE inválido/
);
assert.throws(
  () => core.validateRde_({ ...rde, facts: { norma: 'fato inventado' } }, expected),
  /RDE deve ser um objeto JSON/
);
assert.throws(
  () => core.validateRde_(rde, { ...expected, sourceSha256: 'b'.repeat(64) }),
  /SHA-256 da RDE incompatível/
);
assert.throws(
  () => core.validateRde_({
    ...rde,
    extraction: { ...rde.extraction, created_at: 'not-a-timestamp' }
  }, expected),
  /Objeto extraction inválido/
);

const operationalRde = JSON.parse(existingJson);
operationalRde.extraction.provider = 'FutureProvider';
operationalRde.extraction_warnings = ['Aviso de extração'];
const operationalSnapshot = JSON.stringify(operationalRde);
const operationalExpected = {
  processId: input.processId,
  sourceFileId: input.sourceFileId
};

assert.equal(
  core.validateRdeStructure_(operationalRde, operationalExpected),
  operationalRde
);
assert.equal(JSON.stringify(operationalRde), operationalSnapshot);
assert.equal(
  core.parseAndValidateOperationalRdeJson_(
    JSON.stringify(operationalRde),
    operationalExpected
  ).process_id,
  input.processId
);

function expectValidationCode(rdeValue, code) {
  assert.throws(
    () => core.validateRdeStructure_(rdeValue, operationalExpected),
    error => error.code === code
  );
}

function cloneOperationalRde() {
  return JSON.parse(operationalSnapshot);
}

let invalid = cloneOperationalRde();
invalid.schema_version = '9.9.9';
expectValidationCode(invalid, 'RDE_SCHEMA_VERSION_MISMATCH');

invalid = cloneOperationalRde();
invalid.process_id = 'HAB-OTHER';
expectValidationCode(invalid, 'RDE_PROCESS_ID_MISMATCH');

invalid = cloneOperationalRde();
invalid.source.file_id = 'other-file';
expectValidationCode(invalid, 'RDE_SOURCE_FILE_ID_MISMATCH');

invalid = cloneOperationalRde();
invalid.source.sha256 = 'A'.repeat(64);
expectValidationCode(invalid, 'RDE_SOURCE_HASH_INVALID');

assert.throws(
  () => core.validateSourceHash_('a'.repeat(64), 'b'.repeat(64)),
  error => error.code === 'RDE_SOURCE_HASH_MISMATCH'
);

invalid = cloneOperationalRde();
delete invalid.extraction;
expectValidationCode(invalid, 'RDE_ENVELOPE_INVALID');

invalid = cloneOperationalRde();
invalid.extraction.created_at = '2026-02-31T12:00:00Z';
expectValidationCode(invalid, 'RDE_INVALID_ISO8601');

invalid = cloneOperationalRde();
invalid.records = {};
expectValidationCode(invalid, 'RDE_INVALID_FIELD_TYPE');

invalid = cloneOperationalRde();
invalid.schema_version = '0.1.0';
expectValidationCode(invalid, 'RDE_SCHEMA_VERSION_MISMATCH');

invalid = cloneOperationalRde();
invalid.facts = {};
expectValidationCode(invalid, 'RDE_ENVELOPE_INVALID');

invalid = cloneOperationalRde();
invalid.extraction_warnings = null;
expectValidationCode(invalid, 'RDE_INVALID_FIELD_TYPE');

invalid = cloneOperationalRde();
delete invalid.records;
expectValidationCode(invalid, 'RDE_ENVELOPE_INVALID');

assert.throws(
  () => core.parseAndValidateOperationalRdeJson_('{inválido', operationalExpected),
  error => error.code === 'RDE_INVALID_JSON'
);

const entityCatalog = {
  TEST_DOCUMENT: {
    TYPE: 'DOCUMENT', ATTRIBUTES: ['REQUEST_IDENTIFIER', 'PROTOCOL_IDENTIFIER'],
    ATTRIBUTE_TYPES: { REQUEST_IDENTIFIER: 'TEXT', PROTOCOL_IDENTIFIER: 'TEXT' }
  },
  TEST_SECTION: {
    TYPE: 'DOCUMENT_SECTION', ATTRIBUTES: ['LEGIBLE'],
    ATTRIBUTE_TYPES: { LEGIBLE: 'BOOLEAN' }
  },
  TEST_ITEM: {
    TYPE: 'DOCUMENTARY_EVIDENCE',
    ATTRIBUTES: ['OFFICIAL_ESCI_CODE', 'LABEL', 'DECLARED_DATE', 'DECLARED_ENUM'],
    ATTRIBUTE_TYPES: {
      OFFICIAL_ESCI_CODE: 'TEXT', LABEL: 'TEXT', DECLARED_DATE: 'DATE', DECLARED_ENUM: 'ENUM'
    }
  },
  TEST_NODE: {
    TYPE: 'CONCEPT', ATTRIBUTES: ['LABEL'], ATTRIBUTE_TYPES: { LABEL: 'TEXT' }
  }
};
function record(recordId, entityId, parentId, sourceDocument, attributes = {}, provenance) {
  const item = {
    record_id: recordId,
    entity_id: entityId,
    parent_record_id: parentId,
    source_document: sourceDocument,
    attributes
  };
  if (provenance !== undefined) item.provenance = provenance;
  return item;
}
function validRecords() {
  return [
    record('R000001', 'TEST_DOCUMENT', null, 'R000001',
      { REQUEST_IDENTIFIER: 'REQ-1' }, { page: 1 }),
    record('R000002', 'TEST_SECTION', 'R000001', 'R000001', { LEGIBLE: true }),
    record('R000003', 'TEST_ITEM', 'R000002', 'R000001',
      {
        OFFICIAL_ESCI_CODE: 'AI', LABEL: 'same', DECLARED_DATE: 'not-domain-validated',
        DECLARED_ENUM: 'TEST_ONLY'
      }),
    record('R000004', 'TEST_ITEM', 'R000002', 'R000001',
      {
        OFFICIAL_ESCI_CODE: 'AI', LABEL: 'same', DECLARED_DATE: 'not-domain-validated',
        DECLARED_ENUM: 'TEST_ONLY'
      })
  ];
}
function validateRecords(records, catalog = entityCatalog) {
  return core.validateRdeStructure_(
    { ...operationalRde, records }, operationalExpected, catalog
  );
}

assert.doesNotThrow(() => validateRecords(validRecords()));
assert.doesNotThrow(() => validateRecords([]));
const signatureCatalog = {
  SOURCE_REPORT: { TYPE: 'DOCUMENT', ATTRIBUTES: [], ATTRIBUTE_TYPES: {} },
  SHP_COMMISSIONING_REPORT: {
    TYPE: 'COMMISSIONING_REPORT', ATTRIBUTES: ['SIGNATURE_MECHANISM'],
    ATTRIBUTE_TYPES: { SIGNATURE_MECHANISM: 'TEXT' }
  },
  CONFORMITY_REPORT: {
    TYPE: 'REPORT', ATTRIBUTES: ['SIGNATURE_MECHANISM'],
    ATTRIBUTE_TYPES: { SIGNATURE_MECHANISM: 'TEXT' }
  }
};
assert.doesNotThrow(() => validateRecords([
  record('R_SIGNATURE_SOURCE', 'SOURCE_REPORT', null, 'R_SIGNATURE_SOURCE', {}, { page: 1 }),
  record('R_SHP_REPORT', 'SHP_COMMISSIONING_REPORT', null, 'R_SIGNATURE_SOURCE',
    { SIGNATURE_MECHANISM: 'ICP-Brasil / PAdES' }, { page: 2 })
], signatureCatalog));
assert.doesNotThrow(() => validateRecords([
  record('R_SIGNATURE_SOURCE', 'SOURCE_REPORT', null, 'R_SIGNATURE_SOURCE', {}, { page: 1 }),
  record('R_SHP_REPORT', 'SHP_COMMISSIONING_REPORT', null, 'R_SIGNATURE_SOURCE', {}, { page: 2 })
], signatureCatalog));
assert.throws(() => validateRecords([
  record('R_SIGNATURE_SOURCE', 'SOURCE_REPORT', null, 'R_SIGNATURE_SOURCE', {}, { page: 1 }),
  record('R_SHP_REPORT', 'SHP_COMMISSIONING_REPORT', null, 'R_SIGNATURE_SOURCE',
    { SIGNATURE_MECHANISM: true }, { page: 2 })
], signatureCatalog), error => error.code === 'RDE_ATTRIBUTE_VALUE_TYPE_INVALID');
assert.doesNotThrow(() => validateRecords([
  record('R_CONFORMITY_SOURCE', 'SOURCE_REPORT', null, 'R_CONFORMITY_SOURCE', {}, { page: 1 }),
  record('R_CONFORMITY_REPORT', 'CONFORMITY_REPORT', null, 'R_CONFORMITY_SOURCE',
    { SIGNATURE_MECHANISM: 'ICP-Brasil / PAdES' }, { page: 2 })
], signatureCatalog));
assert.doesNotThrow(() => validateRecords([
  record('R_CONFORMITY_SOURCE', 'SOURCE_REPORT', null, 'R_CONFORMITY_SOURCE', {}, { page: 1 }),
  record('R_CONFORMITY_REPORT', 'CONFORMITY_REPORT', null, 'R_CONFORMITY_SOURCE', {}, { page: 2 })
], signatureCatalog));
assert.throws(() => validateRecords([
  record('R_CONFORMITY_SOURCE', 'SOURCE_REPORT', null, 'R_CONFORMITY_SOURCE', {}, { page: 1 }),
  record('R_CONFORMITY_REPORT', 'CONFORMITY_REPORT', null, 'R_CONFORMITY_SOURCE',
    { SIGNATURE_MECHANISM: false }, { page: 2 })
], signatureCatalog), error => error.code === 'RDE_ATTRIBUTE_VALUE_TYPE_INVALID');
assert.throws(() => validateRecords([
  record('', 'TEST_DOCUMENT', null, '', {})
]), error => error.code === 'RDE_RECORD_FIELD_INVALID');
assert.throws(() => validateRecords([
  ...validRecords(), record('R000004', 'TEST_ITEM', 'R000002', 'R000001', {})
]), error => error.code === 'RDE_DUPLICATE_RECORD_ID');
assert.throws(() => validateRecords([
  record('R000001', '', null, 'R000001', {})
]), error => error.code === 'RDE_RECORD_FIELD_INVALID');
assert.throws(() => validateRecords([
  record('R000001', 'UNDECLARED_ENTITY', null, 'R000001', {})
]), error => error.code === 'RDE_UNKNOWN_ENTITY_ID');
assert.throws(() => validateRecords([
  record('R000001', 'TEST_DOCUMENT', null, 'R000001', { UNKNOWN: 'x' })
]), error => error.code === 'RDE_UNDECLARED_ENTITY_ATTRIBUTE');
assert.throws(() => validateRecords([
  record('R000001', 'TEST_SECTION', null, 'R000001', { LEGIBLE: 'false' })
]), error => error.code === 'RDE_ATTRIBUTE_VALUE_TYPE_INVALID');
assert.throws(() => validateRecords([
  record('R000001', 'TEST_ITEM', null, 'R000001', { DECLARED_DATE: 20261006 })
]), error => error.code === 'RDE_ATTRIBUTE_VALUE_TYPE_INVALID');
assert.throws(() => validateRecords([
  record('R000001', 'TEST_ITEM', null, 'R000001', { DECLARED_ENUM: 1 })
]), error => error.code === 'RDE_ATTRIBUTE_VALUE_TYPE_INVALID');
assert.throws(() => validateRecords([
  record('R000001', 'TEST_ITEM', null, 'R000001', {})
], { TEST_ITEM: { TYPE: 'DOCUMENTARY_EVIDENCE', ATTRIBUTES: ['LABEL'] } }),
error => error.code === 'RDE_ENTITY_CATALOG_INVALID');
assert.throws(() => validateRecords([
  { record_id: 'R000001', entity_id: 'TEST_DOCUMENT', source_document: 'R000001', attributes: {} }
]), error => error.code === 'RDE_RECORD_ENVELOPE_INVALID');
assert.throws(() => validateRecords([
  record('R000001', 'TEST_DOCUMENT', null, 'R000001', { record_id: 'fact' })
]), error => error.code === 'RDE_STRUCTURAL_METADATA_AS_ATTRIBUTE');
assert.throws(() => validateRecords([
  record('R000001', 'TEST_DOCUMENT', null, 'R999999', {})
]), error => error.code === 'RDE_SOURCE_DOCUMENT_DANGLING');
assert.throws(() => validateRecords([
  record('R000001', 'TEST_DOCUMENT', null, 'R000001', {}),
  record('R000002', 'TEST_NODE', 'R000099', 'R000001', {})
]), error => error.code === 'RDE_PARENT_RECORD_DANGLING');
assert.throws(() => validateRecords([
  record('R000001', 'TEST_DOCUMENT', null, 'R000001', {}),
  record('R000002', 'TEST_NODE', null, 'R000002', {})
]), error => error.code === 'RDE_SOURCE_DOCUMENT_NOT_DOCUMENT');
assert.throws(() => validateRecords([
  record('R000001', 'TEST_DOCUMENT', null, 'R000001', {}),
  record('R000002', 'TEST_SECTION', null, 'R000001', {})
]), error => error.code === 'RDE_PARENT_REQUIRED');
assert.throws(() => validateRecords([
  record('R000001', 'TEST_DOCUMENT', null, 'R000001', {}),
  record('R000002', 'TEST_ITEM', 'R000001', 'R000001', {})
]), error => error.code === 'RDE_PARENT_TYPE_INVALID');
const mismatchedSource = validRecords();
mismatchedSource.push(record('R000015', 'TEST_DOCUMENT', null, 'R000015', {}));
mismatchedSource[2].source_document = 'R000015';
assert.throws(() => validateRecords(mismatchedSource),
  error => error.code === 'RDE_SOURCE_PARENT_MISMATCH');
assert.throws(() => validateRecords([
  record('R000001', 'TEST_DOCUMENT', null, 'R000001', {}),
  record('R000002', 'TEST_NODE', 'R000003', 'R000001', {}),
  record('R000003', 'TEST_NODE', 'R000002', 'R000001', {})
]), error => error.code === 'RDE_PARENT_CYCLE');
assert.equal(validRecords()[2].attributes.REQUEST_IDENTIFIER, undefined);
assert.equal(validRecords()[2].attributes.PROTOCOL_IDENTIFIER, undefined);
assert.deepEqual(validRecords()[2].attributes, validRecords()[3].attributes);
assert.notEqual(validRecords()[2].record_id, validRecords()[3].record_id);

// Explicit immutable legacy fixture: the new runtime rejects it; it does not migrate it.
const legacyRde = {
  ...rde,
  schema_version: '0.1.0',
  document: { document_type: 'OUTRO' },
  facts: {},
  evidence: []
};
delete legacyRde.records;
const legacySnapshot = JSON.stringify(legacyRde);
expectValidationCode(legacyRde, 'RDE_SCHEMA_VERSION_MISMATCH');
assert.equal(JSON.stringify(legacyRde), legacySnapshot);
assert.throws(() => core.validateRde_(legacyRde, expected), /RDE_SCHEMA_VERSION incompatível/);

console.log('RDE core tests passed');
