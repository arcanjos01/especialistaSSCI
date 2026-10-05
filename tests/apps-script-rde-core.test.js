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
    sha256Hex_
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

assert.equal(core.RDE_SCHEMA_VERSION, '0.1.0');
assert.equal(
  core.sha256Hex_(Array.from(Buffer.from('abc'))),
  'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
);

const rde = core.buildFakeRde_(input);
assert.equal(rde.schema_version, '0.1.0');
assert.equal(rde.process_id, input.processId);
assert.equal(rde.source.file_id, input.sourceFileId);
assert.equal(rde.source.sha256, input.sourceSha256);
assert.equal(rde.extraction.provider, 'FAKE_DETERMINISTIC');
assert.deepEqual(JSON.parse(JSON.stringify(rde.facts)), {});
assert.deepEqual(JSON.parse(JSON.stringify(rde.evidence)), []);

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
  /facts deve ser um objeto vazio/
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

console.log('RDE core tests passed');
