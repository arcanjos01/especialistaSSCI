/** Schema da RDE persistida pelo projeto Apps Script. */
const RDE_SCHEMA_VERSION = '0.1.0';
const RDE_EXTRACTOR_VERSION = '0.1.0';
const RDE_FAKE_PROVIDER = 'FAKE_DETERMINISTIC';
const RDE_FAKE_WARNING =
  'Fake deterministic extraction: source document content was not read.';

/** Cria a representação fake sem fatos documentais inferidos ou inventados. */
function buildFakeRde_(input) {
  return {
    schema_version: RDE_SCHEMA_VERSION,
    process_id: input.processId,
    source: {
      file_id: input.sourceFileId,
      file_name: input.sourceFileName,
      mime_type: input.sourceMimeType,
      source_url: input.sourceUrl,
      sha256: input.sourceSha256
    },
    extraction: {
      provider: RDE_FAKE_PROVIDER,
      extractor_version: RDE_EXTRACTOR_VERSION,
      created_at: input.createdAt
    },
    document: {
      document_type: 'OUTRO'
    },
    facts: {},
    evidence: [],
    extraction_warnings: [RDE_FAKE_WARNING]
  };
}

function hasExactKeys_(value, expectedKeys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const actualKeys = Object.keys(value).sort();
  const requiredKeys = expectedKeys.slice().sort();

  return actualKeys.length === requiredKeys.length &&
    actualKeys.every((key, index) => key === requiredKeys[index]);
}

/** Valida a estrutura fake e a identidade do processo/arquivo sem mutações. */
function validateRde_(rde, expected) {
  if (!hasExactKeys_(rde, [
    'schema_version',
    'process_id',
    'source',
    'extraction',
    'document',
    'facts',
    'evidence',
    'extraction_warnings'
  ])) {
    throw new Error('RDE deve ser um objeto JSON.');
  }

  if (rde.schema_version !== RDE_SCHEMA_VERSION) {
    throw new Error('RDE_SCHEMA_VERSION incompatível.');
  }

  if (rde.process_id !== expected.processId) {
    throw new Error('PROCESS_ID da RDE incompatível.');
  }

  if (!hasExactKeys_(rde.source, [
    'file_id', 'file_name', 'mime_type', 'source_url', 'sha256'
  ])) {
    throw new Error('Objeto source ausente ou inválido na RDE.');
  }

  if (rde.source.file_id !== expected.sourceFileId) {
    throw new Error('SOURCE_FILE_ID da RDE incompatível.');
  }

  ['file_name', 'mime_type', 'source_url'].forEach(field => {
    if (
      typeof rde.source[field] !== 'string' ||
      !rde.source[field]
    ) {
      throw new Error('source.' + field + ' ausente ou inválido na RDE.');
    }
  });

  if (!/^[0-9a-f]{64}$/.test(rde.source.sha256 || '')) {
    throw new Error('source.sha256 deve conter 64 caracteres hexadecimais lowercase.');
  }

  if (
    expected.sourceSha256 &&
    rde.source.sha256 !== expected.sourceSha256
  ) {
    throw new Error('SHA-256 da RDE incompatível com o documento-fonte atual.');
  }

  if (
    !hasExactKeys_(rde.extraction, [
      'provider', 'extractor_version', 'created_at'
    ]) ||
    rde.extraction.provider !== RDE_FAKE_PROVIDER ||
    rde.extraction.extractor_version !== RDE_EXTRACTOR_VERSION ||
    typeof rde.extraction.created_at !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
      rde.extraction.created_at
    ) ||
    Number.isNaN(Date.parse(rde.extraction.created_at))
  ) {
    throw new Error('Objeto extraction inválido na RDE fake.');
  }

  if (
    !hasExactKeys_(rde.document, ['document_type']) ||
    rde.document.document_type !== 'OUTRO'
  ) {
    throw new Error('document.document_type deve ser OUTRO nesta etapa.');
  }

  if (
    !hasExactKeys_(rde.facts, []) ||
    Object.keys(rde.facts).length !== 0
  ) {
    throw new Error('facts deve ser um objeto vazio no extrator fake.');
  }

  if (!Array.isArray(rde.evidence) || rde.evidence.length !== 0) {
    throw new Error('evidence deve ser um array vazio no extrator fake.');
  }

  if (
    !Array.isArray(rde.extraction_warnings) ||
    rde.extraction_warnings.length !== 1 ||
    rde.extraction_warnings[0] !== RDE_FAKE_WARNING
  ) {
    throw new Error('Aviso de extração simulada ausente na RDE.');
  }

  return rde;
}

/** Faz parse e validação de uma RDE existente, sem alterar seu conteúdo. */
function parseAndValidateRdeJson_(content, expected) {
  let rde;

  try {
    rde = JSON.parse(content);
  } catch (error) {
    throw new Error('JSON da RDE inválido: ' + error.message);
  }

  return validateRde_(rde, expected);
}

function makeRdeValidationError_(code, message) {
  const error = new Error(message || code);
  error.code = code;
  return error;
}

function isIso8601DateTime_(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|([+-])(\d{2}):(\d{2}))$/
  );

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const offsetHour = Number(match[9] || 0);
  const offsetMinute = Number(match[10] || 0);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (
    month < 1 || month > 12 ||
    day < 1 || day > monthDays[month - 1] ||
    hour > 23 || minute > 59 || second > 59 ||
    offsetHour > 23 || offsetMinute > 59
  ) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
}

function requireRdeObject_(value, path) {
  if (value === undefined || value === null) {
    throw makeRdeValidationError_(
      'RDE_MISSING_REQUIRED_FIELD',
      path + ' ausente.'
    );
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw makeRdeValidationError_(
      'RDE_INVALID_FIELD_TYPE',
      path + ' deve ser um objeto.'
    );
  }
}

function requireRdeString_(object, field, path) {
  if (!Object.prototype.hasOwnProperty.call(object, field)) {
    throw makeRdeValidationError_(
      'RDE_MISSING_REQUIRED_FIELD',
      path + ' ausente.'
    );
  }

  if (typeof object[field] !== 'string' || !object[field]) {
    throw makeRdeValidationError_(
      'RDE_INVALID_FIELD_TYPE',
      path + ' deve ser uma string não vazia.'
    );
  }

  return object[field];
}

/** Valida apenas estrutura e identidade; não interpreta facts nem evidence. */
function validateRdeStructure_(rde, expected) {
  requireRdeObject_(rde, 'RDE');

  if (rde.schema_version !== RDE_SCHEMA_VERSION) {
    throw makeRdeValidationError_(
      'RDE_SCHEMA_VERSION_MISMATCH',
      'schema_version deve ser ' + RDE_SCHEMA_VERSION + '.'
    );
  }

  if (rde.process_id !== expected.processId) {
    throw makeRdeValidationError_(
      'RDE_PROCESS_ID_MISMATCH',
      'process_id não corresponde ao PROCESS_ID do registro.'
    );
  }

  requireRdeObject_(rde.source, 'source');

  if (rde.source.file_id !== expected.sourceFileId) {
    throw makeRdeValidationError_(
      'RDE_SOURCE_FILE_ID_MISMATCH',
      'source.file_id não corresponde ao SOURCE_FILE_ID do registro.'
    );
  }

  requireRdeString_(rde.source, 'file_name', 'source.file_name');
  requireRdeString_(rde.source, 'mime_type', 'source.mime_type');
  requireRdeString_(rde.source, 'source_url', 'source.source_url');

  if (
    typeof rde.source.sha256 !== 'string' ||
    !/^[0-9a-f]{64}$/.test(rde.source.sha256)
  ) {
    throw makeRdeValidationError_(
      'RDE_SOURCE_HASH_INVALID',
      'source.sha256 deve conter 64 caracteres hexadecimais lowercase.'
    );
  }

  requireRdeObject_(rde.extraction, 'extraction');
  requireRdeString_(rde.extraction, 'provider', 'extraction.provider');
  requireRdeString_(
    rde.extraction,
    'extractor_version',
    'extraction.extractor_version'
  );

  if (!Object.prototype.hasOwnProperty.call(rde.extraction, 'created_at')) {
    throw makeRdeValidationError_(
      'RDE_MISSING_REQUIRED_FIELD',
      'extraction.created_at ausente.'
    );
  }

  if (!isIso8601DateTime_(rde.extraction.created_at)) {
    throw makeRdeValidationError_(
      'RDE_INVALID_ISO8601',
      'extraction.created_at não é uma data ISO-8601 válida.'
    );
  }

  requireRdeObject_(rde.document, 'document');
  requireRdeString_(rde.document, 'document_type', 'document.document_type');
  requireRdeObject_(rde.facts, 'facts');

  if (!Array.isArray(rde.evidence)) {
    throw makeRdeValidationError_(
      'RDE_INVALID_FIELD_TYPE',
      'evidence deve ser um array.'
    );
  }

  if (!Array.isArray(rde.extraction_warnings)) {
    throw makeRdeValidationError_(
      'RDE_INVALID_FIELD_TYPE',
      'extraction_warnings deve ser um array.'
    );
  }

  return rde;
}

function parseAndValidateOperationalRdeJson_(content, expected) {
  let rde;

  try {
    rde = JSON.parse(content);
  } catch (error) {
    throw makeRdeValidationError_(
      'RDE_INVALID_JSON',
      'O arquivo da RDE não contém JSON válido.'
    );
  }

  return validateRdeStructure_(rde, expected);
}

function validateSourceHash_(expectedHash, actualHash) {
  if (
    typeof expectedHash !== 'string' ||
    !/^[0-9a-f]{64}$/.test(expectedHash)
  ) {
    throw makeRdeValidationError_(
      'RDE_SOURCE_HASH_INVALID',
      'source.sha256 deve conter 64 caracteres hexadecimais lowercase.'
    );
  }

  if (expectedHash !== actualHash) {
    throw makeRdeValidationError_(
      'RDE_SOURCE_HASH_MISMATCH',
      'source.sha256 diverge do hash atual do documento-fonte.'
    );
  }

  return true;
}

/** Calcula SHA-256 dos bytes recebidos via Drive Blob, sem interpretar conteúdo. */
function sha256Hex_(bytes) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    bytes
  );

  return digest.map(byte => {
    const value = (byte + 256) % 256;
    return value.toString(16).padStart(2, '0');
  }).join('');
}
