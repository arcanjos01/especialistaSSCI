const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const compiledContract = require('../apps-script/CompiledRuntimeContract.js');

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
    isSupportedRdeSchemaVersion_,
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
assert.equal(core.isSupportedRdeSchemaVersion_('0.2.0'), true);
assert.equal(core.isSupportedRdeSchemaVersion_('0.3.0'), true);
assert.equal(core.isSupportedRdeSchemaVersion_('0.1.0'), false);
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

assert.equal(core.RDE_SCHEMA_VERSION, '0.3.0');
assert.equal(
  core.sha256Hex_(Array.from(Buffer.from('abc'))),
  'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
);

const rde = core.buildFakeRde_(input);
assert.equal(rde.schema_version, '0.3.0');
assert.equal(rde.process_id, input.processId);
assert.equal(rde.source.file_id, input.sourceFileId);
assert.equal(rde.source.sha256, input.sourceSha256);
assert.equal(rde.extraction.provider, 'FAKE_DETERMINISTIC');
assert.deepEqual(JSON.parse(JSON.stringify(rde.records)), []);
assert.deepEqual(JSON.parse(JSON.stringify(rde.documentary_associations)), []);

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

let rootAssociationReads = 0;
const rootAssociationAccessor = { ...operationalRde };
Object.defineProperty(rootAssociationAccessor, 'documentary_associations', {
  enumerable: true,
  get() { rootAssociationReads += 1; return []; }
});
expectValidationCode(rootAssociationAccessor, 'RDE_ENVELOPE_INVALID');
assert.equal(rootAssociationReads, 0);

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
const legacyStructuralRde = {
  ...operationalRde,
  schema_version: '0.2.0',
  records: validRecords()
};
delete legacyStructuralRde.documentary_associations;
assert.equal(core.validateRdeStructure_(legacyStructuralRde, operationalExpected, entityCatalog),
  legacyStructuralRde);
assert.equal(core.parseAndValidateOperationalRdeJson_(
  JSON.stringify(legacyStructuralRde), operationalExpected, entityCatalog
).schema_version, '0.2.0');
const unsupportedAssociationRde = {
  ...legacyStructuralRde,
  documentary_associations: []
};
expectValidationCode(unsupportedAssociationRde, 'RDE_ENVELOPE_INVALID');
const associationRecords = [
  record('R_ASSOC_SOURCE', 'TEST_DOCUMENT', null, 'R_ASSOC_SOURCE', {}),
  record('R_ASSOC_DRT', 'TEST_ITEM', null, 'R_ASSOC_SOURCE', { LABEL: 'DRT declarada' }),
  record('R_ASSOC_REPORT', 'TEST_ITEM', null, 'R_ASSOC_SOURCE', { LABEL: 'Laudo declarado' })
];
const association = {
  association_id: 'A000001', left_record_id: 'R_ASSOC_REPORT',
  right_record_id: 'R_ASSOC_DRT', source_document: 'R_ASSOC_SOURCE',
  statement_text: 'Laudo associado à DRT (texto documental literal)',
  provenance: { page: 3, text_span: 'linha 4' }
};
assert.doesNotThrow(() => validateRecords(associationRecords, entityCatalog));
assert.doesNotThrow(() => core.validateRdeStructure_({
  ...operationalRde, records: associationRecords, documentary_associations: [association]
}, operationalExpected, entityCatalog));
function invalidAssociation(candidate, code) {
  assert.throws(() => core.validateRdeStructure_({
    ...operationalRde,
    records: associationRecords,
    documentary_associations: [candidate]
  }, operationalExpected, entityCatalog), error => error.code === code);
}
invalidAssociation({ ...association, right_record_id: 'R_MISSING' }, 'RDE_ASSOCIATION_ENDPOINT_DANGLING');
invalidAssociation({ ...association, source_document: 'R_ASSOC_DRT' }, 'RDE_ASSOCIATION_SOURCE_NOT_DOCUMENT');
invalidAssociation({ ...association, left_record_id: 'R_ASSOC_DRT' }, 'RDE_ASSOCIATION_SELF_LINK');
invalidAssociation({ ...association, source_document: 'R_MISSING' }, 'RDE_ASSOCIATION_SOURCE_DANGLING');
invalidAssociation({ ...association, association_id: '' }, 'RDE_ASSOCIATION_INVALID');
invalidAssociation({ ...association, extra: true }, 'RDE_ASSOCIATION_INVALID');
invalidAssociation({ ...association, provenance: [] }, 'RDE_ASSOCIATION_PROVENANCE_INVALID');
assert.throws(() => core.validateRdeStructure_({
  ...operationalRde, records: associationRecords, documentary_associations: new Array(1)
}, operationalExpected, entityCatalog), error => error.code === 'RDE_ASSOCIATIONS_INVALID');
const associationWithAccessor = { ...association };
Object.defineProperty(associationWithAccessor, 'statement_text', {
  enumerable: true, get() { return 'must not be evaluated'; }
});
invalidAssociation(associationWithAccessor, 'RDE_ASSOCIATION_INVALID');
assert.throws(() => core.validateRdeStructure_({
  ...operationalRde,
  records: associationRecords,
  documentary_associations: [association, { ...association, association_id: 'A000002' }]
}, operationalExpected, entityCatalog), error => error.code === 'RDE_ASSOCIATION_DUPLICATE');
assert.throws(() => core.validateRdeStructure_({
  ...operationalRde,
  records: associationRecords,
  documentary_associations: [association, { ...association, association_id: 'A000001', statement_text: 'Outro texto' }]
}, operationalExpected, entityCatalog), error => error.code === 'RDE_ASSOCIATION_ID_DUPLICATE');
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
const drtFactFields = {
  DRT_IDENTIFIER: 'ART 000123',
  COUNCIL_REGISTRATION_STATUS: 'registrada no conselho',
  COUNCIL_ISSUANCE_STATUS: 'emitida; não é rascunho',
  COUNCIL_PAYMENT_STATUS: 'paga',
  SIGNATURE_PARTY: 'Conselho emissor',
  SIGNATURE_MECHANISM: 'certificação digital do conselho emissor',
  RI_NAME: 'Responsável pelo imóvel',
  RT_NAME: 'Responsável técnico declarado',
  PROPERTY_ADDRESS_TEXT: 'Rua demonstrativa, 10, Centro',
  PROPERTY_AREA_TEXT: '120,00 m² (área informada)',
  DECLARED_ACTIVITY_SERVICE_TEXT: 'Execução de sistema preventivo; serviço descrito na DRT',
  DECLARED_SMSCI_SCOPE_TEXT: 'Sistema preventivo contra incêndio e pânico',
  DRT_ISSUE_DATE_TEXT: 'Data de emissão: 15/03/2026'
};
const drtFactRecords = [
  record('R_DRT_SOURCE', 'PPCI', null, 'R_DRT_SOURCE', {}, { page: 1 }),
  record('R_DRT_RT_SOURCE', 'PPCI', null, 'R_DRT_RT_SOURCE', {}, { page: 1 }),
  record('R_DRT_FACT_DRT', 'DRT', null, 'R_DRT_FACT_DRT',
    { ...drtFactFields, DRT_IDENTIFIER: 'DRT 000123',
      DRT_DOCUMENT_ROLE_TEXT: 'DRT de execução (fixture sintética)' },
    { page: 2, field: 'explicitly-labeled' }),
  record('R_DRT_FACT_DISTRATO', 'DRT', null, 'R_DRT_FACT_DISTRATO', {
    DRT_IDENTIFIER: 'DRT 000124',
    DRT_ISSUE_DATE_TEXT: 'Data de emissão: 16/03/2026',
    DRT_DOCUMENT_ROLE_TEXT: 'DRT de distrato de contrato (fixture sintética)',
    DRT_TERMINATION_SERVICES_TEXT: 'Serviços efetivamente realizados e sob responsabilidade (fixture sintética)'
  }, { page: 3, field: 'explicitly-labeled' }),
  record('R_DRT_FACT_CANCELLED', 'DRT', null, 'R_DRT_FACT_CANCELLED', {
    DRT_IDENTIFIER: 'DRT 000125',
    DRT_DOCUMENT_ROLE_TEXT: 'DRT com declaração de situação (fixture sintética)',
    DRT_CANCELLATION_STATUS_TEXT: 'Esta DRT foi revogada ou cancelada (fixture sintética)'
  }, { page: 4, field: 'explicitly-labeled' }),
  record('R_DRT_FACT_ART_RT', 'ART', null, 'R_DRT_RT_SOURCE', {
    ...drtFactFields,
    DRT_IDENTIFIER: 'ART 000456',
    SIGNATURE_PARTY: 'RT',
    SIGNATURE_MECHANISM: 'assinatura digital do RT',
    RT_NAME: 'RT identificado nesta ART',
    PROPERTY_AREA_TEXT: '85 m²',
    DRT_ISSUE_DATE_TEXT: '15/03/2026',
    DRT_DOCUMENT_ROLE_TEXT: 'ART identificada documentalmente (fixture sintética)'
  }, { page: 2, field: 'explicitly-labeled' }),
  ...['ART', 'RRT', 'TRT'].map((entityId, index) => record(
    'R_DRT_FACT_' + entityId,
    entityId,
    null,
    'R_DRT_SOURCE',
    { ...drtFactFields, DRT_IDENTIFIER: entityId + ' 000123' },
    { page: index + 3, field: 'explicitly-labeled' }
  ))
];
const drtFactSnapshot = JSON.stringify(drtFactRecords);
assert.doesNotThrow(() => validateRecords(drtFactRecords, compiledContract.entityCatalog));
assert.equal(JSON.stringify(drtFactRecords), drtFactSnapshot);
assert.doesNotThrow(() => validateRecords([
  record('R_DRT_SOURCE', 'PPCI', null, 'R_DRT_SOURCE', {}, { page: 1 }),
  record('R_DRT_ART_ABSENT', 'ART', 'R_DRT_SOURCE', 'R_DRT_SOURCE', {}, { page: 2 })
], compiledContract.entityCatalog));
assert.throws(() => validateRecords([
  record('R_DRT_SOURCE', 'PPCI', null, 'R_DRT_SOURCE', {}, { page: 1 }),
  record('R_DRT_ART_BAD_TYPE', 'ART', 'R_DRT_SOURCE', 'R_DRT_SOURCE',
    { DRT_ISSUE_DATE_TEXT: 20260315 }, { page: 2 })
], compiledContract.entityCatalog), error => error.code === 'RDE_ATTRIBUTE_VALUE_TYPE_INVALID');
assert.throws(() => validateRecords([
  record('R_DRT_SOURCE', 'PPCI', null, 'R_DRT_SOURCE', {}, { page: 1 }),
  record('R_NON_DRT_SIGNATURE', 'PRESSURIZATION_OPERATION_MANUAL', 'R_DRT_SOURCE', 'R_DRT_SOURCE',
    { DRT_TERMINATION_SERVICES_TEXT: 'Serviço explicitamente descrito' }, { page: 2 })
], compiledContract.entityCatalog), error => error.code === 'RDE_UNDECLARED_ENTITY_ATTRIBUTE');
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
let attributesGetterCalls = 0;
const recordWithComputedAttributes = { ...record('R_COMPUTED_ATTRS', 'TEST_DOCUMENT', null,
  'R_COMPUTED_ATTRS', {}) };
Object.defineProperty(recordWithComputedAttributes, 'attributes', {
  enumerable: true, get() { attributesGetterCalls += 1; return {}; }
});
assert.throws(() => validateRecords([recordWithComputedAttributes]),
  error => error.code === 'RDE_RECORD_ENVELOPE_INVALID');
assert.equal(attributesGetterCalls, 0);
let attributeValueGetterCalls = 0;
const computedAttributeValue = {};
Object.defineProperty(computedAttributeValue, 'REQUEST_IDENTIFIER', {
  enumerable: true, get() { attributeValueGetterCalls += 1; return 'TEST_ONLY'; }
});
assert.throws(() => validateRecords([
  record('R_COMPUTED_ATTR_VALUE', 'TEST_DOCUMENT', null, 'R_COMPUTED_ATTR_VALUE',
    computedAttributeValue)
]), error => error.code === 'RDE_RECORD_ATTRIBUTES_INVALID');
assert.equal(attributeValueGetterCalls, 0);
let provenanceGetterCalls = 0;
const computedProvenance = {};
Object.defineProperty(computedProvenance, 'page', {
  enumerable: true, get() { provenanceGetterCalls += 1; return 1; }
});
assert.throws(() => validateRecords([
  record('R_COMPUTED_PROVENANCE', 'TEST_DOCUMENT', null, 'R_COMPUTED_PROVENANCE', {},
    computedProvenance)
]), error => error.code === 'RDE_RECORD_PROVENANCE_INVALID');
assert.equal(provenanceGetterCalls, 0);
let provenanceArrayMapCalls = 0;
const provenanceArrayPrototype = Object.create(Array.prototype);
provenanceArrayPrototype.map = function forgedMap() {
  provenanceArrayMapCalls += 1;
  return ['unvalidated provenance'];
};
const provenanceArray = ['TEST_ONLY factual location'];
Object.setPrototypeOf(provenanceArray, provenanceArrayPrototype);
assert.doesNotThrow(() => validateRecords([
  record('R_PROVENANCE_ARRAY', 'TEST_DOCUMENT', null, 'R_PROVENANCE_ARRAY', {},
    { locations: provenanceArray })
]));
assert.equal(provenanceArrayMapCalls, 0);
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
