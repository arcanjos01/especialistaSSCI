/** Schema da RDE persistida pelo projeto Apps Script. */
const RDE_SCHEMA_VERSION = '0.3.0';
const RDE_PREVIOUS_SCHEMA_VERSION = '0.2.0';
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
    records: [],
    documentary_associations: [],
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
  if (!rde || typeof rde !== 'object' || Array.isArray(rde)) {
    throw new Error('RDE deve ser um objeto JSON.');
  }

  if (rde.schema_version !== RDE_SCHEMA_VERSION) {
    throw new Error('RDE_SCHEMA_VERSION incompatível.');
  }

  if (!hasExactKeys_(rde, [
    'schema_version',
    'process_id',
    'source',
    'extraction',
    'records',
    'documentary_associations',
    'extraction_warnings'
  ])) {
    throw new Error('RDE deve ser um objeto JSON.');
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

  if (!Array.isArray(rde.records) || rde.records.length !== 0) {
    throw new Error('records deve ser uma coleção vazia no extrator fake.');
  }

  if (!Array.isArray(rde.documentary_associations) || rde.documentary_associations.length !== 0) {
    throw new Error('documentary_associations deve ser vazia no extrator fake.');
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

function isPlainRdeObject_(value) {
  if (!value || Object.prototype.toString.call(value) !== '[object Object]') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}

function rdeEntityDefinition_(entityCatalog, entityId) {
  if (!entityCatalog || !Object.prototype.hasOwnProperty.call(entityCatalog, entityId)) {
    return null;
  }
  const definition = entityCatalog[entityId];
  if (!isPlainRdeObject_(definition) || typeof definition.TYPE !== 'string' ||
      !definition.TYPE || !Array.isArray(definition.ATTRIBUTES) ||
      definition.ATTRIBUTES.some(attribute => typeof attribute !== 'string' || !attribute) ||
      !isPlainRdeObject_(definition.ATTRIBUTE_TYPES) ||
      Object.keys(definition.ATTRIBUTE_TYPES).sort().join('\u0000') !==
        definition.ATTRIBUTES.slice().sort().join('\u0000') ||
      Object.values(definition.ATTRIBUTE_TYPES).some(type =>
        !['BOOLEAN', 'DATE', 'ENUM', 'TEXT'].includes(type)
      )) {
    throw makeRdeValidationError_(
      'RDE_ENTITY_CATALOG_INVALID', 'Definição estrutural inválida para ' + entityId + '.'
    );
  }
  return definition;
}

function validateRdeRecordEnvelope_(records, entityCatalog) {
  if (!Array.isArray(records)) {
    throw makeRdeValidationError_('RDE_INVALID_FIELD_TYPE', 'records deve ser um array.');
  }
  if (records.length && !entityCatalog) {
    throw makeRdeValidationError_(
      'RDE_ENTITY_CATALOG_REQUIRED',
      'entityCatalog é obrigatório para validar relações e atributos de records.'
    );
  }
  if (records.length && !isPlainRdeObject_(entityCatalog)) {
    throw makeRdeValidationError_(
      'RDE_ENTITY_CATALOG_INVALID', 'entityCatalog deve ser um objeto simples indexado por entity_id.'
    );
  }

  const recordsById = Object.create(null);
  const definitionsById = Object.create(null);
  records.forEach((record, index) => {
    const requiredKeys = [
      'record_id', 'entity_id', 'parent_record_id', 'source_document', 'attributes'
    ];
    if (!isPlainRdeObject_(record)) {
      throw makeRdeValidationError_(
        'RDE_RECORD_INVALID', 'records[' + index + '] deve ser um objeto.'
      );
    }
    const keys = Object.keys(record).sort();
    const allowed = requiredKeys.concat(['provenance']).sort();
    if (requiredKeys.some(key => !Object.prototype.hasOwnProperty.call(record, key)) ||
        keys.some(key => !allowed.includes(key))) {
      throw makeRdeValidationError_(
        'RDE_RECORD_ENVELOPE_INVALID',
        'records[' + index + '] deve obedecer ao envelope RDE 0.2.0.'
      );
    }
    ['record_id', 'entity_id', 'source_document'].forEach(field => {
      if (typeof record[field] !== 'string' || !record[field]) {
        throw makeRdeValidationError_(
          'RDE_RECORD_FIELD_INVALID', 'records[' + index + '].' + field + ' deve ser string não vazia.'
        );
      }
    });
    if (record.parent_record_id !== null &&
        (typeof record.parent_record_id !== 'string' || !record.parent_record_id)) {
      throw makeRdeValidationError_(
        'RDE_RECORD_FIELD_INVALID',
        'records[' + index + '].parent_record_id deve ser string não vazia ou null.'
      );
    }
    if (Object.prototype.hasOwnProperty.call(recordsById, record.record_id)) {
      throw makeRdeValidationError_(
        'RDE_DUPLICATE_RECORD_ID', 'record_id duplicado: ' + record.record_id
      );
    }
    if (!isPlainRdeObject_(record.attributes)) {
      throw makeRdeValidationError_(
        'RDE_RECORD_ATTRIBUTES_INVALID', 'records[' + index + '].attributes deve ser objeto.'
      );
    }
    ['record_id', 'entity_id', 'parent_record_id', 'source_document', 'provenance']
      .forEach(field => {
        if (Object.prototype.hasOwnProperty.call(record.attributes, field)) {
          throw makeRdeValidationError_(
            'RDE_STRUCTURAL_METADATA_AS_ATTRIBUTE',
            'Metadado estrutural não pode ser atributo documental: ' + field
          );
        }
      });
    const definition = rdeEntityDefinition_(entityCatalog, record.entity_id);
    if (entityCatalog && !definition) {
      throw makeRdeValidationError_(
        'RDE_UNKNOWN_ENTITY_ID', 'entity_id não declarado: ' + record.entity_id
      );
    }
    if (definition) {
      const undeclared = Object.keys(record.attributes).filter(
        attribute => !definition.ATTRIBUTES.includes(attribute)
      );
      if (undeclared.length) {
        throw makeRdeValidationError_(
          'RDE_UNDECLARED_ENTITY_ATTRIBUTE',
          'Atributo não declarado para ' + record.entity_id + ': ' + undeclared.sort().join(', ')
        );
      }
      Object.keys(record.attributes).sort().forEach(attribute => {
        const value = record.attributes[attribute];
        const declaredType = definition.ATTRIBUTE_TYPES[attribute];
        const typeMatches = declaredType === 'BOOLEAN'
          ? typeof value === 'boolean'
          : ['DATE', 'ENUM', 'TEXT'].includes(declaredType) && typeof value === 'string';
        if (!typeMatches) {
          throw makeRdeValidationError_(
            'RDE_ATTRIBUTE_VALUE_TYPE_INVALID',
            'Tipo incompatível para ' + record.entity_id + '.' + attribute + ' (' + declaredType + ').'
          );
        }
      });
    }
    if (Object.prototype.hasOwnProperty.call(record, 'provenance') &&
        record.provenance !== null && !isPlainRdeObject_(record.provenance)) {
      throw makeRdeValidationError_(
        'RDE_RECORD_PROVENANCE_INVALID', 'provenance deve ser objeto quando informado.'
      );
    }
    recordsById[record.record_id] = record;
    definitionsById[record.record_id] = definition;
  });

  records.forEach(record => {
    const source = recordsById[record.source_document];
    if (!source) {
      throw makeRdeValidationError_(
        'RDE_SOURCE_DOCUMENT_DANGLING', 'source_document não existe: ' + record.source_document
      );
    }
    const sourceDefinition = definitionsById[record.source_document];
    if (sourceDefinition && sourceDefinition.TYPE !== 'DOCUMENT') {
      throw makeRdeValidationError_(
        'RDE_SOURCE_DOCUMENT_NOT_DOCUMENT', 'source_document deve apontar para TYPE DOCUMENT.'
      );
    }
    const definition = definitionsById[record.record_id];
    if (definition && definition.TYPE === 'DOCUMENT') {
      if (record.parent_record_id !== null) {
        throw makeRdeValidationError_(
          'RDE_DOCUMENT_PARENT_INVALID', 'DOCUMENT deve ter parent_record_id null.'
        );
      }
      if (record.source_document !== record.record_id) {
        throw makeRdeValidationError_(
          'RDE_DOCUMENT_SOURCE_INVALID', 'DOCUMENT deve apontar source_document para si próprio.'
        );
      }
    }
    if (record.parent_record_id !== null) {
      const parent = recordsById[record.parent_record_id];
      if (!parent) {
        throw makeRdeValidationError_(
          'RDE_PARENT_RECORD_DANGLING', 'parent_record_id não existe: ' + record.parent_record_id
        );
      }
      const parentDefinition = definitionsById[record.parent_record_id];
      if (definition && parentDefinition && definition.TYPE === 'DOCUMENT_SECTION' &&
          parentDefinition.TYPE !== 'DOCUMENT') {
        throw makeRdeValidationError_(
          'RDE_PARENT_TYPE_INVALID', 'DOCUMENT_SECTION deve ter DOCUMENT como pai.'
        );
      }
      if (definition && parentDefinition && definition.TYPE === 'DOCUMENT_SECTION' &&
          record.source_document !== parent.record_id) {
        throw makeRdeValidationError_(
          'RDE_SOURCE_PARENT_MISMATCH',
          'DOCUMENT_SECTION deve apontar source_document para seu DOCUMENT pai.'
        );
      }
      if (definition && parentDefinition && definition.TYPE === 'DOCUMENTARY_EVIDENCE' &&
          parentDefinition.TYPE !== 'DOCUMENT_SECTION') {
        throw makeRdeValidationError_(
          'RDE_PARENT_TYPE_INVALID', 'DOCUMENTARY_EVIDENCE deve ter DOCUMENT_SECTION como pai.'
        );
      }
      if (definition && parentDefinition && definition.TYPE === 'DOCUMENTARY_EVIDENCE' &&
          record.source_document !== parent.source_document) {
        throw makeRdeValidationError_(
          'RDE_SOURCE_PARENT_MISMATCH',
          'DOCUMENTARY_EVIDENCE deve preservar source_document de sua seção pai.'
        );
      }
    } else if (definition && definition.TYPE === 'DOCUMENT_SECTION') {
      throw makeRdeValidationError_(
        'RDE_PARENT_REQUIRED', 'DOCUMENT_SECTION deve apontar para seu DOCUMENT pai.'
      );
    }
  });

  const stateById = Object.create(null);
  function visit(recordId) {
    if (stateById[recordId] === 1) {
      throw makeRdeValidationError_('RDE_PARENT_CYCLE', 'Relação parent_record_id cíclica.');
    }
    if (stateById[recordId] === 2) return;
    stateById[recordId] = 1;
    const parentId = recordsById[recordId].parent_record_id;
    if (parentId !== null) visit(parentId);
    stateById[recordId] = 2;
  }
  records.forEach(record => visit(record.record_id));
  return true;
}

function canonicalRdeJson_(value, active) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return JSON.stringify(value);
  }
  if (typeof value !== 'object') {
    throw makeRdeValidationError_(
      'RDE_ASSOCIATION_PROVENANCE_INVALID',
      'documentary_associations.provenance deve conter somente valores JSON.'
    );
  }
  const seen = active || new Set();
  if (seen.has(value)) {
    throw makeRdeValidationError_(
      'RDE_ASSOCIATION_PROVENANCE_INVALID',
      'documentary_associations.provenance não pode conter ciclos.'
    );
  }
  seen.add(value);
  let serialized;
  if (Array.isArray(value)) {
    if (Object.getOwnPropertySymbols(value).length ||
        Object.keys(value).length !== value.length ||
        Object.getOwnPropertyNames(value).length !== value.length + 1) {
      throw makeRdeValidationError_(
        'RDE_ASSOCIATION_PROVENANCE_INVALID',
        'Arrays em provenance devem conter somente posições indexadas.'
      );
    }
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw makeRdeValidationError_(
          'RDE_ASSOCIATION_PROVENANCE_INVALID',
          'Arrays em provenance devem conter somente valores de dados.'
        );
      }
    }
    serialized = '[' + value.map(item => canonicalRdeJson_(item, seen)).join(',') + ']';
  } else if (isPlainRdeObject_(value)) {
    if (Object.getOwnPropertySymbols(value).length ||
        Object.getOwnPropertyNames(value).length !== Object.keys(value).length) {
      throw makeRdeValidationError_(
        'RDE_ASSOCIATION_PROVENANCE_INVALID',
        'Objetos em provenance devem conter somente campos JSON enumeráveis.'
      );
    }
    Object.keys(value).forEach(key => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw makeRdeValidationError_(
          'RDE_ASSOCIATION_PROVENANCE_INVALID',
          'Provenance não pode conter propriedades calculadas.'
        );
      }
    });
    serialized = '{' + Object.keys(value).sort().map(key =>
      JSON.stringify(key) + ':' + canonicalRdeJson_(value[key], seen)
    ).join(',') + '}';
  } else {
    seen.delete(value);
    throw makeRdeValidationError_(
      'RDE_ASSOCIATION_PROVENANCE_INVALID',
      'documentary_associations.provenance deve conter somente objetos simples.'
    );
  }
  seen.delete(value);
  return serialized;
}

function validateRdeDocumentaryAssociations_(associations, records, entityCatalog) {
  if (!Array.isArray(associations)) {
    throw makeRdeValidationError_(
      'RDE_ASSOCIATIONS_INVALID',
      'documentary_associations deve ser um array.'
    );
  }
  const recordsById = Object.create(null);
  records.forEach(record => { recordsById[record.record_id] = record; });
  const associationIds = Object.create(null);
  const structuralAssociations = Object.create(null);
  associations.forEach((association, index) => {
    if (!isPlainRdeObject_(association)) {
      throw makeRdeValidationError_(
        'RDE_ASSOCIATION_INVALID',
        'documentary_associations[' + index + '] deve ser um objeto.'
      );
    }
    const required = [
      'association_id', 'left_record_id', 'right_record_id', 'source_document', 'statement_text'
    ];
    const allowed = required.concat(['provenance']);
    const keys = Object.keys(association);
    if (Object.getOwnPropertySymbols(association).length ||
        Object.getOwnPropertyNames(association).length !== keys.length ||
        keys.some(key => {
          const descriptor = Object.getOwnPropertyDescriptor(association, key);
          return !descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value');
        }) || required.some(key => !keys.includes(key)) ||
        keys.some(key => !allowed.includes(key))) {
      throw makeRdeValidationError_(
        'RDE_ASSOCIATION_INVALID',
        'documentary_associations[' + index + '] tem campos ausentes ou não declarados.'
      );
    }
    required.forEach(key => {
      if (typeof association[key] !== 'string' || !association[key]) {
        throw makeRdeValidationError_(
          'RDE_ASSOCIATION_INVALID',
          'documentary_associations[' + index + '].' + key + ' deve ser string não vazia.'
        );
      }
    });
    if (association.left_record_id === association.right_record_id) {
      throw makeRdeValidationError_(
        'RDE_ASSOCIATION_SELF_LINK',
        'Uma associação documental deve relacionar dois registros distintos.'
      );
    }
    if (!Object.prototype.hasOwnProperty.call(recordsById, association.left_record_id) ||
        !Object.prototype.hasOwnProperty.call(recordsById, association.right_record_id)) {
      throw makeRdeValidationError_(
        'RDE_ASSOCIATION_ENDPOINT_DANGLING',
        'Os endpoints da associação devem resolver para registros da mesma RDE.'
      );
    }
    const source = recordsById[association.source_document];
    if (!source) {
      throw makeRdeValidationError_(
        'RDE_ASSOCIATION_SOURCE_DANGLING',
        'source_document da associação deve resolver para a mesma RDE.'
      );
    }
    const sourceDefinition = entityCatalog[source.entity_id];
    if (!sourceDefinition || sourceDefinition.TYPE !== 'DOCUMENT') {
      throw makeRdeValidationError_(
        'RDE_ASSOCIATION_SOURCE_NOT_DOCUMENT',
        'source_document da associação deve apontar para TYPE DOCUMENT.'
      );
    }
    if (Object.prototype.hasOwnProperty.call(associationIds, association.association_id)) {
      throw makeRdeValidationError_(
        'RDE_ASSOCIATION_ID_DUPLICATE',
        'association_id duplicado: ' + association.association_id
      );
    }
    associationIds[association.association_id] = true;
    if (Object.prototype.hasOwnProperty.call(association, 'provenance') &&
        association.provenance !== null && !isPlainRdeObject_(association.provenance)) {
      throw makeRdeValidationError_(
        'RDE_ASSOCIATION_PROVENANCE_INVALID',
        'provenance da associação deve ser objeto simples quando informada.'
      );
    }
    const endpoints = [association.left_record_id, association.right_record_id].sort();
    const signature = canonicalRdeJson_({
      endpoints,
      source_document: association.source_document,
      statement_text: association.statement_text,
      has_provenance: Object.prototype.hasOwnProperty.call(association, 'provenance'),
      provenance: Object.prototype.hasOwnProperty.call(association, 'provenance')
        ? association.provenance : null
    });
    if (Object.prototype.hasOwnProperty.call(structuralAssociations, signature)) {
      throw makeRdeValidationError_(
        'RDE_ASSOCIATION_DUPLICATE',
        'Uma associação documental estruturalmente idêntica já foi declarada.'
      );
    }
    structuralAssociations[signature] = true;
  });
  return true;
}

/** Valida estrutura RDE 0.2.0/0.3.0 sem executar Requirements ou Criteria. */
function validateRdeStructure_(rde, expected, entityCatalog) {
  requireRdeObject_(rde, 'RDE');

  if (rde.schema_version !== RDE_SCHEMA_VERSION) {
    if (rde.schema_version !== RDE_PREVIOUS_SCHEMA_VERSION) {
      throw makeRdeValidationError_(
        'RDE_SCHEMA_VERSION_MISMATCH',
        'schema_version deve ser ' + RDE_SCHEMA_VERSION + ' ou ' +
          RDE_PREVIOUS_SCHEMA_VERSION + '.'
      );
    }
  }

  const expectedEnvelopeKeys = [
    'schema_version', 'process_id', 'source', 'extraction', 'records', 'extraction_warnings'
  ];
  if (rde.schema_version === RDE_SCHEMA_VERSION) {
    expectedEnvelopeKeys.push('documentary_associations');
  }
  if (!hasExactKeys_(rde, expectedEnvelopeKeys)) {
    throw makeRdeValidationError_(
      'RDE_ENVELOPE_INVALID',
      'O envelope raiz não corresponde à versão RDE declarada.'
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

  validateRdeRecordEnvelope_(rde.records, entityCatalog);

  if (rde.schema_version === RDE_SCHEMA_VERSION) {
    validateRdeDocumentaryAssociations_(rde.documentary_associations, rde.records, entityCatalog);
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
