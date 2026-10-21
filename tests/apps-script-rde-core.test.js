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
    validateRdeActivityItems_,
    validateRdeDrtScopeDeclarationItems_,
    parseAndValidateOperationalRdeJson_,
    canonicalRdeJson_,
    getValidatedRdeDigest_,
    getValidatedRdeIdentity_,
    validateSourceHash_
  };
`, context);

const core = context.rdeCore;
assert.equal(core.isSupportedRdeSchemaVersion_('0.2.0'), true);
assert.equal(core.isSupportedRdeSchemaVersion_('0.3.0'), true);
assert.equal(core.isSupportedRdeSchemaVersion_('0.4.0'), true);
assert.equal(core.isSupportedRdeSchemaVersion_('0.5.0'), true);
assert.equal(core.isSupportedRdeSchemaVersion_('0.6.0'), true);
assert.equal(core.isSupportedRdeSchemaVersion_('0.7.0'), true);
const originalArrayIncludes = Array.prototype.includes;
try {
  vm.runInContext(`
    globalThis.__originalArrayIncludes = Array.prototype.includes;
    Array.prototype.includes = function () { throw new Error('prototype pollution'); };
  `, context);
  assert.equal(core.isSupportedRdeSchemaVersion_('0.6.0'), true);
} finally {
  vm.runInContext('Array.prototype.includes = globalThis.__originalArrayIncludes; delete globalThis.__originalArrayIncludes;', context);
}
assert.equal(Array.prototype.includes, originalArrayIncludes);
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

assert.equal(core.RDE_SCHEMA_VERSION, '0.7.0');
assert.equal(
  core.sha256Hex_(Array.from(Buffer.from('abc'))),
  'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
);

const unicodeRdeInput = core.buildFakeRde_({
  ...input,
  sourceFileName: 'Relatório 🧯.pdf',
  sourceFileId: 'unicode-file-id'
});
const unicodeRde = core.parseAndValidateOperationalRdeJson_(
  JSON.stringify(unicodeRdeInput),
  { processId: unicodeRdeInput.process_id, sourceFileId: unicodeRdeInput.source.file_id,
    rdeIdentity: 'unicode-file-id' },
  compiledContract.entityCatalog
);
assert.equal(
  core.getValidatedRdeDigest_(unicodeRde),
  crypto.createHash('sha256').update(core.canonicalRdeJson_(unicodeRde), 'utf8').digest('hex')
);
assert.equal(core.getValidatedRdeIdentity_(unicodeRde), 'unicode-file-id');
const secondRde = core.parseAndValidateOperationalRdeJson_(
  JSON.stringify(unicodeRdeInput),
  { processId: unicodeRdeInput.process_id, sourceFileId: unicodeRdeInput.source.file_id,
    rdeIdentity: 'second-rde-file-id' },
  compiledContract.entityCatalog
);
assert.equal(core.getValidatedRdeIdentity_(secondRde), 'second-rde-file-id');
assert.notEqual(core.getValidatedRdeIdentity_(unicodeRde), core.getValidatedRdeIdentity_(secondRde));

const rde = core.buildFakeRde_(input);
assert.equal(rde.schema_version, '0.7.0');
assert.equal(rde.process_id, input.processId);
assert.equal(rde.source.file_id, input.sourceFileId);
assert.equal(rde.source.sha256, input.sourceSha256);
const identitylessRde = core.parseAndValidateOperationalRdeJson_(
  JSON.stringify(rde), { processId: input.processId, sourceFileId: input.sourceFileId },
  compiledContract.entityCatalog
);
assert.throws(() => core.getValidatedRdeIdentity_(identitylessRde),
  /identity requires parser-authenticated RDE/);
assert.throws(() => core.parseAndValidateOperationalRdeJson_(
  JSON.stringify(rde), { processId: input.processId, sourceFileId: input.sourceFileId,
    rdeIdentity: '' }, compiledContract.entityCatalog
), error => error.code === 'RDE_IDENTITY_MISMATCH');
assert.equal(rde.extraction.provider, 'FAKE_DETERMINISTIC');
assert.deepEqual(JSON.parse(JSON.stringify(rde.records)), []);
assert.deepEqual(JSON.parse(JSON.stringify(rde.documentary_associations)), []);
assert.deepEqual(JSON.parse(JSON.stringify(rde.drt_declaration_items)), []);
assert.deepEqual(JSON.parse(JSON.stringify(rde.documentary_date_items)), []);
assert.deepEqual(JSON.parse(JSON.stringify(rde.drt_activity_items)), []);
assert.deepEqual(JSON.parse(JSON.stringify(rde.drt_scope_declaration_items)), []);

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
const requestEntityCatalog = {
  ...entityCatalog,
  REQUERIMENTO_ESCI: compiledContract.entityCatalog.REQUERIMENTO_ESCI
};
const requestFormRecord = record(
  'R_TEST_ONLY_REQUEST_FORM',
  'REQUERIMENTO_ESCI',
  null,
  'R_TEST_ONLY_REQUEST_FORM',
  {
    HABITESE_REQUEST_FINALITY_TEXT: 'TEST_ONLY_HABITESE',
    REQUESTER_NAME_TEXT: 'TEST_ONLY_REQUESTER_NAME',
    REQUESTER_CPF_TEXT: 'TEST_ONLY_REQUESTER_CPF_EXACT_LITERAL',
    REQUESTER_EQUALITY_DECLARATION_TEXT: 'TEST_ONLY_EQUALITY_DECLARATION_LITERAL',
    TECHNICAL_RESPONSIBLE_NAME_TEXT: 'TEST_ONLY_RT_NAME',
    TECHNICAL_RESPONSIBLE_CPF_TEXT: 'TEST_ONLY_RT_CPF_EXACT_LITERAL',
    TECHNICAL_RESPONSIBLE_EQUALITY_DECLARATION_TEXT: 'TEST_ONLY_EQUALITY_DECLARATION_LITERAL'
  },
  { locations: ['TEST_ONLY_PAGE_47_FIELDS'] }
);
const requestFormSnapshot = JSON.stringify(requestFormRecord);
assert.doesNotThrow(() => validateRecords([requestFormRecord], requestEntityCatalog));
assert.equal(JSON.stringify(requestFormRecord), requestFormSnapshot);
const legacyStructuralRde = {
  ...operationalRde,
  schema_version: '0.2.0',
  records: validRecords()
};
delete legacyStructuralRde.documentary_associations;
delete legacyStructuralRde.drt_declaration_items;
delete legacyStructuralRde.documentary_date_items;
delete legacyStructuralRde.drt_activity_items;
delete legacyStructuralRde.drt_scope_declaration_items;
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
const legacyV3Rde = { ...operationalRde, schema_version: '0.3.0' };
delete legacyV3Rde.drt_declaration_items;
delete legacyV3Rde.documentary_date_items;
delete legacyV3Rde.drt_activity_items;
delete legacyV3Rde.drt_scope_declaration_items;
assert.equal(core.validateRdeStructure_(legacyV3Rde, operationalExpected, entityCatalog), legacyV3Rde);
const legacyV4Rde = { ...operationalRde, schema_version: '0.4.0' };
delete legacyV4Rde.documentary_date_items;
delete legacyV4Rde.drt_activity_items;
delete legacyV4Rde.drt_scope_declaration_items;
assert.equal(core.validateRdeStructure_(legacyV4Rde, operationalExpected, entityCatalog), legacyV4Rde);
const malformedV4AssociationRde = {
  ...legacyV4Rde,
  documentary_associations: [{
    association_id: 'A-V4-ORPHAN', left_record_id: 'MISSING_LEFT',
    right_record_id: 'MISSING_RIGHT', source_document: 'MISSING_SOURCE',
    statement_text: 'Vínculo não presente na RDE.'
  }]
};
assert.throws(() => core.parseAndValidateOperationalRdeJson_(
  JSON.stringify(malformedV4AssociationRde), operationalExpected, entityCatalog
), error => error.code === 'RDE_ASSOCIATION_ENDPOINT_DANGLING');
const missingV4Declarations = { ...operationalRde };
delete missingV4Declarations.drt_declaration_items;
expectValidationCode(missingV4Declarations, 'RDE_ENVELOPE_INVALID');
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
const declarationRecords = [
  record('R_DECL_SOURCE', 'TEST_DOCUMENT', null, 'R_DECL_SOURCE', {}),
  record('R_DECL_OTHER_SOURCE', 'TEST_DOCUMENT', null, 'R_DECL_OTHER_SOURCE', {}),
  record('R_DECL_DRT', 'ART', null, 'R_DECL_DRT', {})
];
const declaration = {
  declaration_id: 'D000001',
  drt_record_id: 'R_DECL_DRT',
  activity_service_text: 'execução de instalação',
  smsci_scope_text: 'sistema de hidrantes',
  source_document: 'R_DECL_DRT',
  source_text: 'Atividade: execução de instalação; sistema: sistema de hidrantes.',
  provenance: { page: 2, row: 4 }
};
const declarationCatalog = {
  ...entityCatalog,
  ART: compiledContract.entityCatalog.ART,
  RRT: compiledContract.entityCatalog.RRT,
  TRT: compiledContract.entityCatalog.TRT
};
const declarationRde = {
  ...operationalRde,
  records: declarationRecords,
  drt_declaration_items: [declaration]
};
assert.doesNotThrow(() => core.validateRdeStructure_(
  declarationRde, operationalExpected, declarationCatalog
));
for (const concreteEntityId of ['ART', 'RRT', 'TRT']) {
  const recordId = 'R_DECL_' + concreteEntityId;
  const concreteRde = {
    ...operationalRde,
    records: [
      record(recordId, concreteEntityId, null, recordId, {
        RESPONSIBILITY_TYPE: 'EXECUCAO'
      })
    ],
    drt_declaration_items: [{
      declaration_id: 'D_' + concreteEntityId,
      drt_record_id: recordId,
      activity_service_text: 'execução',
      smsci_scope_text: 'sistema de hidrantes',
      source_document: recordId,
      source_text: 'Atividade: execução; sistema: sistema de hidrantes.'
    }]
  };
  assert.doesNotThrow(() => core.validateRdeStructure_(
    concreteRde, operationalExpected, compiledContract.entityCatalog
  ), concreteEntityId);
}
function invalidDeclaration(candidate, code) {
  assert.throws(() => core.validateRdeStructure_({
    ...declarationRde, drt_declaration_items: [candidate]
  }, operationalExpected, declarationCatalog), error => error.code === code);
}
invalidDeclaration({ ...declaration, extra: true }, 'RDE_DRT_DECLARATION_INVALID');
const missingDeclarationField = { ...declaration };
delete missingDeclarationField.smsci_scope_text;
invalidDeclaration(missingDeclarationField, 'RDE_DRT_DECLARATION_INVALID');
invalidDeclaration({ ...declaration, declaration_id: '' }, 'RDE_DRT_DECLARATION_INVALID');
invalidDeclaration({ ...declaration, declaration_id: 'D000001', smsci_scope_text: 'scope absent' },
  'RDE_DRT_DECLARATION_TEXT_MISMATCH');
const legacyV4DeclarationRde = {
  ...declarationRde,
  schema_version: '0.4.0'
};
delete legacyV4DeclarationRde.documentary_date_items;
delete legacyV4DeclarationRde.drt_activity_items;
delete legacyV4DeclarationRde.drt_scope_declaration_items;
for (const sourceText of [
  'Somente o sistema de hidrantes está citado.',
  'Atividade: execução de instalação.'
]) {
  const malformedV4DeclarationRde = {
    ...legacyV4DeclarationRde,
    drt_declaration_items: [{ ...declaration, source_text: sourceText }]
  };
  assert.throws(() => core.parseAndValidateOperationalRdeJson_(
    JSON.stringify(malformedV4DeclarationRde), operationalExpected, declarationCatalog
  ), error => error.code === 'RDE_DRT_DECLARATION_TEXT_MISMATCH');
}
invalidDeclaration({ ...declaration, drt_record_id: 'R_DECL_SOURCE' },
  'RDE_DRT_DECLARATION_DRT_TYPE_INVALID');
invalidDeclaration({ ...declaration, drt_record_id: 'R_MISSING' },
  'RDE_DRT_DECLARATION_DRT_DANGLING');
invalidDeclaration({ ...declaration, source_document: 'R_MISSING' },
  'RDE_DRT_DECLARATION_SOURCE_INVALID');
invalidDeclaration({ ...declaration, source_document: 'R_DECL_OTHER_SOURCE' },
  'RDE_DRT_DECLARATION_SOURCE_MISMATCH');
invalidDeclaration({ ...declaration, activity_service_text: '   ' },
  'RDE_DRT_DECLARATION_INVALID');
invalidDeclaration({ ...declaration, declaration_id: 'D000001', provenance: [] },
  'RDE_DRT_DECLARATION_PROVENANCE_INVALID');
assert.throws(() => core.validateRdeStructure_({
  ...declarationRde,
  drt_declaration_items: [declaration, { ...declaration, declaration_id: 'D000002' }]
}, operationalExpected, declarationCatalog), error => error.code === 'RDE_DRT_DECLARATION_DUPLICATE');
assert.throws(() => core.validateRdeStructure_({
  ...declarationRde,
  drt_declaration_items: new Array(1)
}, operationalExpected, declarationCatalog), error => error.code === 'RDE_DRT_DECLARATIONS_INVALID');
const declarationWithAccessor = { ...declaration };
Object.defineProperty(declarationWithAccessor, 'source_text', {
  enumerable: true, get() { throw new Error('must not be evaluated'); }
});
invalidDeclaration(declarationWithAccessor, 'RDE_DRT_DECLARATION_INVALID');
const declarationArrayWithAccessor = [declaration];
Object.defineProperty(declarationArrayWithAccessor, '0', {
  enumerable: true, get() { throw new Error('must not be evaluated'); }
});
assert.throws(() => core.validateRdeStructure_({
  ...declarationRde, drt_declaration_items: declarationArrayWithAccessor
}, operationalExpected, declarationCatalog), error =>
  error.code === 'RDE_DRT_DECLARATIONS_INVALID' ||
  error.code === 'RDE_DRT_DECLARATION_INVALID'
);
const dateRecords = [
  record('R_DATE_SOURCE', 'TEST_DOCUMENT', null, 'R_DATE_SOURCE', {}),
  record('R_DATE_REPORT', 'TEST_REPORT', null, 'R_DATE_SOURCE', {})
];
const dateItem = {
  date_item_id: 'DATE-001', product_record_id: 'R_DATE_REPORT',
  date_label_text: 'Data do ensaio', date_text: '03/04/2026',
  source_document: 'R_DATE_SOURCE',
  source_text: 'Data do ensaio: 03/04/2026', provenance: { page: 4, row: 2 }
};
const dateCatalog = {
  ...entityCatalog,
  TEST_REPORT: { TYPE: 'TEST_REPORT', ATTRIBUTES: [], ATTRIBUTE_TYPES: {} }
};
const dateRde = {
  ...operationalRde, records: dateRecords, documentary_date_items: [dateItem]
};
assert.doesNotThrow(() => core.validateRdeStructure_(dateRde, operationalExpected, dateCatalog));
function invalidDate(candidate, code, overrides = {}) {
  assert.throws(() => core.validateRdeStructure_({
    ...dateRde, documentary_date_items: [candidate], ...overrides
  }, operationalExpected, dateCatalog), error => error.code === code);
}
invalidDate({ ...dateItem, extra: true }, 'RDE_DOCUMENTARY_DATE_INVALID');
invalidDate({ ...dateItem, date_text: '2026-04-03' }, 'RDE_DOCUMENTARY_DATE_TEXT_MISMATCH');
invalidDate({ ...dateItem, product_record_id: 'R_DATE_SOURCE' },
  'RDE_DOCUMENTARY_DATE_PRODUCT_TYPE_INVALID');
invalidDate({ ...dateItem, product_record_id: 'R_MISSING' },
  'RDE_DOCUMENTARY_DATE_PRODUCT_DANGLING');
invalidDate({ ...dateItem, source_document: 'R_DATE_REPORT' },
  'RDE_DOCUMENTARY_DATE_SOURCE_INVALID');
invalidDate({ ...dateItem, date_item_id: '' }, 'RDE_DOCUMENTARY_DATE_INVALID');
invalidDate({ ...dateItem, provenance: [] }, 'RDE_DOCUMENTARY_DATE_PROVENANCE_INVALID');
invalidDate(dateItem, 'RDE_DOCUMENTARY_DATE_SOURCE_MISMATCH', {
  records: [...dateRecords, record('R_OTHER_SOURCE', 'TEST_DOCUMENT', null, 'R_OTHER_SOURCE', {})],
  documentary_date_items: [{ ...dateItem, source_document: 'R_OTHER_SOURCE' }]
});
assert.doesNotThrow(() => core.validateRdeStructure_({
  ...dateRde,
  documentary_date_items: [dateItem, { ...dateItem, date_item_id: 'DATE-002' }]
}, operationalExpected, dateCatalog));
assert.throws(() => core.validateRdeStructure_({
  ...dateRde, documentary_date_items: new Array(1)
}, operationalExpected, dateCatalog), error => error.code === 'RDE_DOCUMENTARY_DATES_INVALID');

const activityRde = {
  ...declarationRde,
  schema_version: '0.6.0',
  documentary_date_items: [],
  drt_activity_items: [{
    activity_item_id: 'ACT-001', drt_record_id: 'R_DECL_DRT',
    activity_service_text: 'execução de instalação',
    source_document: 'R_DECL_DRT',
    source_text: 'Atividade: execução de instalação; sistema não declarado.'
  }]
};
delete activityRde.drt_scope_declaration_items;
assert.doesNotThrow(() => core.validateRdeStructure_(activityRde, operationalExpected, declarationCatalog));
assert.throws(() => core.validateRdeStructure_({
  ...activityRde,
  drt_activity_items: [{ ...activityRde.drt_activity_items[0], smsci_scope_text: 'sistema de hidrantes' }]
}, operationalExpected, declarationCatalog), error => error.code === 'RDE_ACTIVITY_ITEM_INVALID');
assert.throws(() => core.validateRdeStructure_({
  ...activityRde,
  drt_activity_items: [{ ...activityRde.drt_activity_items[0], activity_item_id: 'ACT-001', extra: true }]
}, operationalExpected, declarationCatalog), error => error.code === 'RDE_ACTIVITY_ITEM_INVALID');
assert.doesNotThrow(() => core.validateRdeActivityItems_(
  activityRde.drt_activity_items, activityRde.records, declarationCatalog
));
const scopeCatalog = {
  ...declarationCatalog,
  TEST_REPORT: { TYPE: 'TEST_REPORT', ATTRIBUTES: [], ATTRIBUTE_TYPES: {} }
};
const scopeRecord = record('R_SCOPE_PRODUCT', 'TEST_REPORT', null, 'R_DECL_OTHER_SOURCE', {});
const scopeItem = {
  scope_declaration_item_id: 'SCOPE-001', drt_record_id: 'R_DECL_DRT',
  drt_reference_text: 'ART 12345', product_record_id: 'R_SCOPE_PRODUCT',
  product_reference_text: 'Relatório RT-777', smsci_text: 'sistema de hidrantes',
  activity_service_text: 'execução de instalação', source_document: 'R_DECL_SOURCE',
  source_text: 'A ART 12345 para o Relatório RT-777 abrange sistema de hidrantes e execução de instalação.',
  provenance: { page: 3, paragraph: 2 }
};
const scopeRde = {
  ...operationalRde,
  records: declarationRecords.concat([scopeRecord]),
  drt_scope_declaration_items: [scopeItem]
};
assert.doesNotThrow(() => core.validateRdeStructure_(scopeRde, operationalExpected, scopeCatalog));
assert.doesNotThrow(() => core.validateRdeDrtScopeDeclarationItems_(
  scopeRde.drt_scope_declaration_items, scopeRde.records, scopeCatalog
));
const originalObjectCreate = Object.create;
try {
  Object.create = function () { throw new Error('patched Object.create'); };
  assert.doesNotThrow(() => core.validateRdeDrtScopeDeclarationItems_(
    scopeRde.drt_scope_declaration_items, scopeRde.records, scopeCatalog
  ));
} finally {
  Object.create = originalObjectCreate;
}
for (const [candidate, code] of [
  [{ ...scopeItem, drt_record_id: 'R_MISSING' }, 'RDE_DRT_SCOPE_DRT_DANGLING'],
  [{ ...scopeItem, product_record_id: 'R_MISSING' }, 'RDE_DRT_SCOPE_PRODUCT_DANGLING'],
  [{ ...scopeItem, source_document: 'R_MISSING' }, 'RDE_DRT_SCOPE_SOURCE_INVALID'],
  [{ ...scopeItem, activity_service_text: 'not in excerpt' }, 'RDE_DRT_SCOPE_TEXT_MISMATCH'],
  [{ ...scopeItem, extra: true }, 'RDE_DRT_SCOPE_ITEM_INVALID'],
  [{ ...scopeItem, provenance: [] }, 'RDE_DRT_SCOPE_PROVENANCE_INVALID']
]) {
  assert.throws(() => core.validateRdeStructure_({
    ...scopeRde, drt_scope_declaration_items: [candidate]
  }, operationalExpected, scopeCatalog), error => error.code === code);
}
assert.throws(() => core.validateRdeStructure_({
  ...scopeRde,
  drt_scope_declaration_items: [{ ...scopeItem, source_text: 'Sistema de hidrantes para execução de instalação.' }]
}, operationalExpected, scopeCatalog), error => error.code === 'RDE_DRT_SCOPE_TEXT_MISMATCH');
assert.throws(() => core.validateRdeStructure_({
  ...scopeRde,
  drt_scope_declaration_items: [scopeItem, { ...scopeItem, scope_declaration_item_id: 'SCOPE-002' }]
}, operationalExpected, scopeCatalog), error => error.code === 'RDE_DRT_SCOPE_ITEM_DUPLICATE');
assert.throws(() => core.validateRdeStructure_({
  ...scopeRde,
  drt_scope_declaration_items: [scopeItem, { ...scopeItem }]
}, operationalExpected, scopeCatalog), error => error.code === 'RDE_DRT_SCOPE_ITEM_ID_DUPLICATE');
assert.throws(() => core.validateRdeStructure_({
  ...scopeRde, drt_scope_declaration_items: new Array(1)
}, operationalExpected, scopeCatalog), error => error.code === 'RDE_DRT_SCOPE_ITEMS_INVALID');
const personAsProduct = record('R_SCOPE_PERSON', 'RT', null, 'R_DECL_SOURCE', {});
assert.throws(() => core.validateRdeDrtScopeDeclarationItems_([{
  ...scopeItem, product_record_id: 'R_SCOPE_PERSON'
}], scopeRde.records.concat([personAsProduct]), scopeCatalog), error =>
  error.code === 'RDE_DRT_SCOPE_PRODUCT_TYPE_INVALID');
assert.throws(() => core.validateRdeDrtScopeDeclarationItems_([{
  ...scopeItem, provenance: null
}], scopeRde.records, scopeCatalog), error =>
  error.code === 'RDE_DRT_SCOPE_PROVENANCE_INVALID');
assert.throws(() => core.validateRdeDrtScopeDeclarationItems_([{
  ...scopeItem, provenance: {}
}], scopeRde.records, scopeCatalog), error =>
  error.code === 'RDE_DRT_SCOPE_PROVENANCE_INVALID');
const scopeWithAccessor = { ...scopeItem };
Object.defineProperty(scopeWithAccessor, 'source_text', {
  enumerable: true, get() { throw new Error('scope accessor must not be evaluated'); }
});
assert.throws(() => core.validateRdeDrtScopeDeclarationItems_(
  [scopeWithAccessor], scopeRde.records, scopeCatalog
), error => error.code === 'RDE_DRT_SCOPE_ITEM_INVALID');
const helperNames = ['rdeHasOwn_', 'rdeNonBlankText_', 'rdeLiteralIndexOf_'];
for (const name of helperNames) {
  const descriptor = vm.runInContext(`Object.getOwnPropertyDescriptor(globalThis, '${name}')`, context);
  assert.equal(descriptor.writable, false, `${name} must be locked`);
  assert.equal(descriptor.configurable, false, `${name} must be non-configurable`);
  assert.equal(vm.runInContext(`Reflect.set(globalThis, '${name}', () => true)`, context), false);
}
try {
  vm.runInContext(`
    globalThis.__originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    Object.getOwnPropertyDescriptor = function (target, key) {
      if (key === 'source_text') return { value: 'Atividade: execução de instalação; sistema não declarado.' };
      return globalThis.__originalGetOwnPropertyDescriptor(target, key);
    };
  `, context);
  assert.throws(() => core.validateRdeActivityItems_([{
    ...activityRde.drt_activity_items[0], source_text: 'A fonte não declara esse serviço.'
  }], activityRde.records, declarationCatalog), error =>
    error.code === 'RDE_ACTIVITY_ITEM_TEXT_MISMATCH');
} finally {
  vm.runInContext(`
    Object.getOwnPropertyDescriptor = globalThis.__originalGetOwnPropertyDescriptor;
    delete globalThis.__originalGetOwnPropertyDescriptor;
  `, context);
}
assert.throws(() => core.validateRdeActivityItems_([{
  ...activityRde.drt_activity_items[0], drt_record_id: 'ORPHAN_DRT'
}], activityRde.records, declarationCatalog), error =>
  error.code === 'RDE_ACTIVITY_ITEM_DRT_DANGLING');
const otherDrtRecord = {
  record_id: 'R_OTHER_DRT', entity_id: 'ART', parent_record_id: null,
  source_document: 'R_OTHER_DRT', attributes: {},
  provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'OTHER_DRT' }
};
assert.throws(() => core.validateRdeActivityItems_([{
  ...activityRde.drt_activity_items[0], source_document: 'R_OTHER_DRT'
}], declarationRde.records.concat([otherDrtRecord]), declarationCatalog), error =>
  error.code === 'RDE_ACTIVITY_ITEM_SOURCE_MISMATCH');
assert.throws(() => core.validateRdeActivityItems_([
  activityRde.drt_activity_items[0],
  { ...activityRde.drt_activity_items[0], activity_item_id: 'ACT-002' }
], activityRde.records, declarationCatalog), error =>
  error.code === 'RDE_ACTIVITY_ITEM_DUPLICATE');
const accessorActivity = { ...activityRde.drt_activity_items[0] };
let activityAccessorCalled = false;
Object.defineProperty(accessorActivity, 'source_text', {
  enumerable: true, get() { activityAccessorCalled = true; return 'forged'; }
});
assert.throws(() => core.validateRdeActivityItems_([accessorActivity], activityRde.records, declarationCatalog), error =>
  error.code === 'RDE_ACTIVITY_ITEM_INVALID');
assert.equal(activityAccessorCalled, false);
const hiddenActivityField = { ...activityRde.drt_activity_items[0] };
Object.defineProperty(hiddenActivityField, 'hidden', { value: true });
assert.throws(() => core.validateRdeActivityItems_([hiddenActivityField], activityRde.records, declarationCatalog), error =>
  error.code === 'RDE_ACTIVITY_ITEM_INVALID');
const symbolActivityField = { ...activityRde.drt_activity_items[0] };
symbolActivityField[Symbol('hidden')] = true;
assert.throws(() => core.validateRdeActivityItems_([symbolActivityField], activityRde.records, declarationCatalog), error =>
  error.code === 'RDE_ACTIVITY_ITEM_INVALID');
const namedPropertyHole = new Array(1);
namedPropertyHole.activity = activityRde.drt_activity_items[0];
assert.throws(() => core.validateRdeActivityItems_(namedPropertyHole, activityRde.records, declarationCatalog), error =>
  error.code === 'RDE_ACTIVITY_ITEMS_INVALID');
assert.throws(() => core.validateRdeActivityItems_([{
  ...activityRde.drt_activity_items[0], provenance: []
}], activityRde.records, declarationCatalog), error =>
  error.code === 'RDE_ACTIVITY_ITEM_PROVENANCE_INVALID');
try {
  vm.runInContext(`
    globalThis.__originalForEach = Array.prototype.forEach;
    globalThis.__originalStringIndexOf = String.prototype.indexOf;
    Array.prototype.forEach = function () { throw new Error('prototype pollution'); };
    String.prototype.indexOf = function () { throw new Error('prototype pollution'); };
  `, context);
  assert.doesNotThrow(() => core.validateRdeActivityItems_(
    activityRde.drt_activity_items, activityRde.records, declarationCatalog
  ));
} finally {
  vm.runInContext(`
    Array.prototype.forEach = globalThis.__originalForEach;
    String.prototype.indexOf = globalThis.__originalStringIndexOf;
    delete globalThis.__originalForEach;
    delete globalThis.__originalStringIndexOf;
  `, context);
}
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
  COUNCIL_STATE: 'SC',
  RESPONSIBILITY_TYPE: 'EXECUCAO',
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
  record('R_DRT_FACT_DRT', 'ART', null, 'R_DRT_FACT_DRT',
    { ...drtFactFields, DRT_IDENTIFIER: 'DRT 000123',
      DRT_DOCUMENT_ROLE_TEXT: 'DRT de execução (fixture sintética)' },
    { page: 2, field: 'explicitly-labeled' }),
  record('R_DRT_FACT_DISTRATO', 'RRT', null, 'R_DRT_FACT_DISTRATO', {
    DRT_IDENTIFIER: 'DRT 000124',
    DRT_ISSUE_DATE_TEXT: 'Data de emissão: 16/03/2026',
    DRT_DOCUMENT_ROLE_TEXT: 'DRT de distrato de contrato (fixture sintética)',
    DRT_TERMINATION_SERVICES_TEXT: 'Serviços efetivamente realizados e sob responsabilidade (fixture sintética)'
  }, { page: 3, field: 'explicitly-labeled' }),
  record('R_DRT_FACT_CANCELLED', 'TRT', null, 'R_DRT_FACT_CANCELLED', {
    DRT_IDENTIFIER: 'DRT 000125',
    DRT_DOCUMENT_ROLE_TEXT: 'DRT com declaração de situação (fixture sintética)',
    DRT_CANCELLATION_STATUS_TEXT: 'Esta DRT foi revogada ou cancelada (fixture sintética)'
  }, { page: 4, field: 'explicitly-labeled' }),
  record('R_DRT_FACT_ART_RT', 'ART', null, 'R_DRT_FACT_ART_RT', {
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
    'R_DRT_FACT_' + entityId,
    { ...drtFactFields, DRT_IDENTIFIER: entityId + ' 000123' },
    { page: index + 3, field: 'explicitly-labeled' }
  ))
];
const drtFactSnapshot = JSON.stringify(drtFactRecords);
assert.doesNotThrow(() => validateRecords(drtFactRecords, compiledContract.entityCatalog));
for (const [index, entityId] of ['ART', 'RRT', 'TRT'].entries()) {
  const statusRecord = drtFactRecords.find(item => item.record_id === 'R_DRT_FACT_' + entityId);
  assert.equal(statusRecord.entity_id, entityId);
  assert.deepEqual(JSON.parse(JSON.stringify({
    registration: statusRecord.attributes.COUNCIL_REGISTRATION_STATUS,
    issuance: statusRecord.attributes.COUNCIL_ISSUANCE_STATUS,
    payment: statusRecord.attributes.COUNCIL_PAYMENT_STATUS
  })), {
    registration: drtFactFields.COUNCIL_REGISTRATION_STATUS,
    issuance: drtFactFields.COUNCIL_ISSUANCE_STATUS,
    payment: drtFactFields.COUNCIL_PAYMENT_STATUS
  }, entityId);
  assert.equal(statusRecord.provenance.page, index + 3);
}
const statusLiteralCases = [
  ['ART', 'registrada no CREA-SC', 'emitida eletronicamente', 'paga'],
  ['RRT', 'registro provisório', 'rascunho', 'isenta de taxa'],
  ['TRT', 'validada pelo conselho', 'aguardando emissão', 'status indisponível']
];
for (const [index, [entityId, registration, issuance, payment]] of statusLiteralCases.entries()) {
  const rawStatus = record('R_RAW_STATUS_' + entityId, entityId, null,
    'R_RAW_STATUS_' + entityId, {
      COUNCIL_REGISTRATION_STATUS: registration,
      COUNCIL_ISSUANCE_STATUS: issuance,
      COUNCIL_PAYMENT_STATUS: payment
    }, { page: index + 1, field: 'status-literal', text: 'literal-' + entityId });
  const statusRde = {
    ...operationalRde,
    records: [rawStatus]
  };
  const validatedStatusRde = core.parseAndValidateOperationalRdeJson_(
    JSON.stringify(statusRde), operationalExpected, compiledContract.entityCatalog
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(validatedStatusRde)),
    JSON.parse(JSON.stringify(statusRde)),
    entityId + ' complete RDE round trip'
  );
  const roundTrippedStatusRecord = validatedStatusRde.records[0];
  assert.deepEqual(JSON.parse(JSON.stringify([
    roundTrippedStatusRecord.attributes.COUNCIL_REGISTRATION_STATUS,
    roundTrippedStatusRecord.attributes.COUNCIL_ISSUANCE_STATUS,
    roundTrippedStatusRecord.attributes.COUNCIL_PAYMENT_STATUS
  ])), [registration, issuance, payment], entityId);
  assert.deepEqual(JSON.parse(JSON.stringify(roundTrippedStatusRecord.provenance)), {
    page: index + 1, field: 'status-literal', text: 'literal-' + entityId
  }, entityId);
  assert.equal(Object.hasOwn(roundTrippedStatusRecord.attributes, 'COUNCIL_STATUS_CLASSIFICATION'), false, entityId);
}
assert.throws(() => validateRecords([
  record('R_DRT_SOURCE_ABSTRACT', 'PPCI', null, 'R_DRT_SOURCE_ABSTRACT', {}, { page: 1 }),
  record('R_DRT_ABSTRACT', 'DRT', null, 'R_DRT_SOURCE_ABSTRACT',
    { RESPONSIBILITY_TYPE: 'EXECUCAO' }, { page: 2 })
], compiledContract.entityCatalog), error => error.code === 'RDE_ABSTRACT_ENTITY');
assert.equal(JSON.stringify(drtFactRecords), drtFactSnapshot);
const standaloneArt = [
  record('R_ART_STANDALONE', 'ART', null, 'R_ART_STANDALONE', {
    RESPONSIBILITY_TYPE: 'EXECUCAO',
    DRT_IDENTIFIER: 'ART STANDALONE'
  }, { page: 1, field: 'standalone-document' })
];
assert.doesNotThrow(() => validateRecords(standaloneArt, compiledContract.entityCatalog));
assert.doesNotThrow(() => validateRecords([
  record('R_DRT_SOURCE', 'PPCI', null, 'R_DRT_SOURCE', {}, { page: 1 }),
  record('R_DRT_ART_ABSENT', 'ART', null, 'R_DRT_ART_ABSENT', {}, { page: 2 })
], compiledContract.entityCatalog));
assert.throws(() => validateRecords([
  record('R_DRT_SOURCE', 'PPCI', null, 'R_DRT_SOURCE', {}, { page: 1 }),
  record('R_DRT_ART_BAD_TYPE', 'ART', null, 'R_DRT_ART_BAD_TYPE',
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
let rdeToStringTagGetterCalls = 0;
const computedTagAttributes = {};
Object.defineProperty(computedTagAttributes, Symbol.toStringTag, {
  configurable: true,
  get() { rdeToStringTagGetterCalls += 1; return 'Object'; }
});
assert.throws(() => validateRecords([
  record('R_COMPUTED_TAG_ATTRS', 'TEST_DOCUMENT', null, 'R_COMPUTED_TAG_ATTRS',
    computedTagAttributes)
]), error => error.code === 'RDE_RECORD_ATTRIBUTES_INVALID');
assert.equal(rdeToStringTagGetterCalls, 0);
const dateWithNullPrototype = new Date('2026-10-08T00:00:00.000Z');
Object.setPrototypeOf(dateWithNullPrototype, null);
assert.throws(() => validateRecords([
  record('R_NATIVE_DATE_ATTRS', 'TEST_DOCUMENT', null, 'R_NATIVE_DATE_ATTRS',
    dateWithNullPrototype)
]), error => error.code === 'RDE_RECORD_ATTRIBUTES_INVALID');
const boxedNumberWithNullPrototype = new Number(7);
Object.setPrototypeOf(boxedNumberWithNullPrototype, null);
assert.throws(() => validateRecords([
  record('R_NATIVE_NUMBER_ATTRS', 'TEST_DOCUMENT', null, 'R_NATIVE_NUMBER_ATTRS',
    boxedNumberWithNullPrototype)
]), error => error.code === 'RDE_RECORD_ATTRIBUTES_INVALID');
for (const [label, createNativeValue] of [
  ['MAP', () => new Map([['declared', 'factual value']])],
  ['SET', () => new Set(['factual value'])],
  ['WEAK_MAP', () => new WeakMap([[{}, 'factual value']])],
  ['WEAK_SET', () => new WeakSet([{}])],
  ['ARRAY_BUFFER', () => new ArrayBuffer(4)],
  ['DATA_VIEW', () => new DataView(new ArrayBuffer(4))],
  ['TYPED_ARRAY', () => new Uint8Array([1, 2, 3])]
]) {
  for (const prototype of [null, Object.prototype]) {
    const nativeValue = createNativeValue();
    Object.setPrototypeOf(nativeValue, prototype);
    assert.throws(() => validateRecords([
      record('R_NATIVE_' + label + '_ATTRS', 'TEST_DOCUMENT', null,
        'R_NATIVE_' + label + '_ATTRS', nativeValue)
    ]), error => error.code === 'RDE_RECORD_ATTRIBUTES_INVALID');
  }
}
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
