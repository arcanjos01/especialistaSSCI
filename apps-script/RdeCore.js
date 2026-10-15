/** Schema da RDE persistida pelo projeto Apps Script. */
const RDE_SCHEMA_VERSION = '0.7.0';
const RDE_PREVIOUS_SCHEMA_VERSION = '0.6.0';
const RDE_LEGACY_SCHEMA_VERSION = '0.3.0';
const RDE_HISTORICAL_SCHEMA_VERSION = '0.2.0';
const RDE_INTRINSIC_GET_DESCRIPTOR_ = Object.getOwnPropertyDescriptor;
const RDE_INTRINSIC_GET_NAMES_ = Object.getOwnPropertyNames;
const RDE_INTRINSIC_GET_SYMBOLS_ = Object.getOwnPropertySymbols;
const RDE_INTRINSIC_DEFINE_PROPERTY_ = Object.defineProperty;
const RDE_INTRINSIC_JSON_PARSE_ = JSON.parse;
const RDE_INTRINSIC_JSON_STRINGIFY_ = JSON.stringify;
const RDE_INTRINSIC_KEYS_ = Object.keys;
const RDE_INTRINSIC_FREEZE_ = Object.freeze;
const RDE_INTRINSIC_IS_ARRAY_ = Array.isArray;
const RDE_INTRINSIC_APPLY_ = Reflect.apply;
const RDE_INTRINSIC_CREATE_ = Object.create;
const RDE_INTRINSIC_HAS_OWN_ = Object.prototype.hasOwnProperty;
const RDE_INTRINSIC_STRING_INDEX_OF_ = String.prototype.indexOf;
const RDE_INTRINSIC_STRING_TRIM_ = String.prototype.trim;
const RDE_INTRINSIC_NUMBER_IS_FINITE_ = Number.isFinite;
const RDE_INTRINSIC_ARRAY_PUSH_ = Array.prototype.push;
const RDE_INTRINSIC_ARRAY_JOIN_ = Array.prototype.join;
const RDE_INTRINSIC_ARRAY_SORT_ = Array.prototype.sort;
const RDE_INTRINSIC_SET_HAS_ = Set.prototype.has;
const RDE_INTRINSIC_SET_ADD_ = Set.prototype.add;
const RDE_INTRINSIC_SET_DELETE_ = Set.prototype.delete;
const RDE_INTRINSIC_WEAKSET_ADD_ = WeakSet.prototype.add;
const RDE_INTRINSIC_WEAKSET_HAS_ = WeakSet.prototype.has;

function rdeHasOwn_(object, key) {
  return RDE_INTRINSIC_APPLY_(RDE_INTRINSIC_HAS_OWN_, object, [key]);
}

function rdeNonBlankText_(value) {
  return typeof value === 'string' &&
    RDE_INTRINSIC_APPLY_(RDE_INTRINSIC_STRING_TRIM_, value, []).length > 0;
}

function rdeLiteralIndexOf_(text, needle) {
  return RDE_INTRINSIC_APPLY_(RDE_INTRINSIC_STRING_INDEX_OF_, text, [needle]);
}

function rdeSha256Fallback_(text) {
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const encoded = encodeURIComponent(text);
  const bytes=[]; for(let i=0;i<encoded.length;){ if(encoded.charAt(i)==='%'){bytes.push(parseInt(encoded.slice(i+1,i+3),16));i+=3;} else {bytes.push(encoded.charCodeAt(i));i++;} }
  const bit=bytes.length*8; bytes.push(128); while(bytes.length%64!==56)bytes.push(0); for(let i=7;i>=0;i--)bytes.push(Math.floor(bit/2**(i*8))&255);
  for(let o=0;o<bytes.length;o+=64){const w=[];for(let i=0;i<16;i++)w[i]=(bytes[o+i*4]<<24|bytes[o+i*4+1]<<16|bytes[o+i*4+2]<<8|bytes[o+i*4+3])>>>0;for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2],r=(n,s)=>((n>>>s)|(n<<(32-s)))>>>0;w[i]=(w[i-16]+(r(x,7)^r(x,18)^(x>>>3))+w[i-7]+(r(y,17)^r(y,19)^(y>>>10)) )>>>0;}let [a,b,c,d,e,f,g,h]=H;for(let i=0;i<64;i++){const r=(n,s)=>((n>>>s)|(n<<(32-s)))>>>0;const t1=(h+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g))+K[i]+w[i])>>>0,t2=((r(a,2)^r(a,13)^r(a,22))+((a&b)^(a&c)^(b&c)))>>>0;[h,g,f,e,d,c,b,a]=[g,f,e,(d+t1)>>>0,c,b,a,(t1+t2)>>>0];}H=H.map((v,i)=>(v+[a,b,c,d,e,f,g,h][i])>>>0);}
  return H.map(v=>v.toString(16).padStart(8,'0')).join('');
}

function validatedRdeDigest_(rde) {
  const canonical = canonicalRdeJson_(rde);
  if (typeof Utilities !== 'undefined' && Utilities.newBlob && Utilities.computeDigest) return sha256Hex_(Utilities.newBlob(canonical).getBytes());
  return rdeSha256Fallback_(canonical);
}

function lockRdeValidationHelpers_() {
  const names = [
    'isSupportedRdeSchemaVersion_', 'hasExactKeys_', 'validateRde_',
    'parseAndValidateRdeJson_', 'makeRdeValidationError_', 'isIso8601DateTime_',
    'requireRdeObject_', 'requireRdeString_', 'hasNativeNonJsonBrand_',
    'isPlainRdeObject_', 'rdeEntityDefinition_', 'validateRdeRecordEnvelope_',
    'canonicalRdeJson_', 'validateRdeDocumentaryAssociations_',
    'validateRdeDrtDeclarationItems_', 'validateRdeDocumentaryDateItems_', 'validateRdeActivityItems_',
    'validateRdeDrtScopeDeclarationItems_',
    'rdeHasOwn_', 'rdeNonBlankText_', 'rdeLiteralIndexOf_',
    'validateRdeStructure_', 'parseAndValidateOperationalRdeJson_',
    'validateSourceHash_', 'sha256Hex_', 'rdeSha256Fallback_', 'validatedRdeDigest_'
  ];
  for (let index = 0; index < names.length; index += 1) {
    const descriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(globalThis, names[index]);
    if (descriptor && typeof descriptor.value === 'function') {
      RDE_INTRINSIC_DEFINE_PROPERTY_(globalThis, names[index], {
        value: descriptor.value,
        enumerable: descriptor.enumerable,
        writable: false,
        configurable: false
      });
    }
  }
}
function isSupportedRdeSchemaVersion_(version) {
  return version === '0.2.0' || version === '0.3.0' || version === '0.4.0' ||
    version === '0.5.0' || version === '0.6.0' || version === '0.7.0';
}
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
    drt_declaration_items: [],
    documentary_date_items: [],
    drt_activity_items: [],
    drt_scope_declaration_items: [],
    extraction_warnings: [RDE_FAKE_WARNING]
  };
}

function hasExactKeys_(value, expectedKeys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const actualKeys = Object.keys(value).sort();
  const requiredKeys = expectedKeys.slice().sort();
  if (Object.getOwnPropertySymbols(value).length ||
      Object.getOwnPropertyNames(value).length !== actualKeys.length ||
      actualKeys.some(key => {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        return !descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value');
      })) {
    return false;
  }

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
    'drt_declaration_items',
    'documentary_date_items',
    'drt_activity_items',
    'drt_scope_declaration_items',
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
  if (!Array.isArray(rde.drt_declaration_items) || rde.drt_declaration_items.length !== 0) {
    throw new Error('drt_declaration_items deve ser vazia no extrator fake.');
  }
  if (!Array.isArray(rde.documentary_date_items) || rde.documentary_date_items.length !== 0) {
    throw new Error('documentary_date_items deve ser vazia no extrator fake.');
  }
  if (!Array.isArray(rde.drt_activity_items) || rde.drt_activity_items.length !== 0 ||
      !Array.isArray(rde.drt_scope_declaration_items) || rde.drt_scope_declaration_items.length !== 0) {
    throw new Error('drt_activity_items deve ser vazia no extrator fake.');
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

function hasNativeNonJsonBrand_(value) {
  const probe = {};
  const checks = [
    typeof Map === 'function' && [Map.prototype, 'has'],
    typeof Set === 'function' && [Set.prototype, 'has'],
    typeof WeakMap === 'function' && [WeakMap.prototype, 'has'],
    typeof WeakSet === 'function' && [WeakSet.prototype, 'has']
  ];
  for (let index = 0; index < checks.length; index += 1) {
    const check = checks[index];
    if (!check) continue;
    try {
      Object.getOwnPropertyDescriptor(check[0], check[1]).value.call(value, probe);
      return true;
    } catch (error) {
      // The intrinsic brand check rejects ordinary objects without reading them.
    }
  }
  if (typeof ArrayBuffer === 'function' && ArrayBuffer.isView(value)) return true;
  const bufferTypes = [
    typeof ArrayBuffer === 'function' && ArrayBuffer,
    typeof SharedArrayBuffer === 'function' && SharedArrayBuffer
  ];
  for (let index = 0; index < bufferTypes.length; index += 1) {
    const bufferType = bufferTypes[index];
    if (!bufferType) continue;
    const getter = Object.getOwnPropertyDescriptor(bufferType.prototype, 'byteLength').get;
    try {
      getter.call(value);
      return true;
    } catch (error) {
      // The intrinsic getter rejects values without the corresponding buffer slots.
    }
  }
  if (typeof DataView === 'function') {
    const getter = Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get;
    try {
      getter.call(value);
      return true;
    } catch (error) {
      // The intrinsic getter rejects values without DataView internal slots.
    }
  }
  return false;
}

function isPlainRdeObject_(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (hasNativeNonJsonBrand_(value)) return false;
  let current = value;
  while (current !== null) {
    if (Object.getOwnPropertyDescriptor(current, Symbol.toStringTag)) return false;
    current = Object.getPrototypeOf(current);
  }
  if (Object.prototype.toString.call(value) !== '[object Object]') return false;
  const prototype = Object.getPrototypeOf(value);
  // JSON-parsed RDE objects have an Object prototype; null-prototype containers
  // are not accepted because native Map/Set values lose their intrinsic tag
  // when their prototype is removed.
  return prototype !== null && Object.getPrototypeOf(prototype) === null;
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
      ) || (definition.ABSTRACT !== undefined && typeof definition.ABSTRACT !== 'boolean')) {
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
  if (Object.getOwnPropertySymbols(records).length ||
      Object.keys(records).length !== records.length ||
      Object.getOwnPropertyNames(records).length !== records.length + 1) {
    throw makeRdeValidationError_(
      'RDE_RECORD_ENVELOPE_INVALID', 'records deve ser um array denso sem propriedades extras.'
    );
  }
  for (let index = 0; index < records.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(records, String(index));
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
      throw makeRdeValidationError_(
        'RDE_RECORD_ENVELOPE_INVALID', 'records deve conter registros de dados em todas as posições.'
      );
    }
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

  const recordsById = RDE_INTRINSIC_CREATE_(null);
  const definitionsById = Object.create(null);
  for (let index = 0; index < records.length; index += 1) {
    const record = Object.getOwnPropertyDescriptor(records, String(index)).value;
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
    if (Object.getOwnPropertySymbols(record).length ||
        Object.getOwnPropertyNames(record).length !== keys.length ||
        keys.some(key => {
          const descriptor = Object.getOwnPropertyDescriptor(record, key);
          return !descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value');
        }) || requiredKeys.some(key => !Object.prototype.hasOwnProperty.call(record, key)) ||
        keys.some(key => !allowed.includes(key))) {
      throw makeRdeValidationError_(
        'RDE_RECORD_ENVELOPE_INVALID',
        'records[' + index + '] deve obedecer ao envelope de registro da RDE.'
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
    try {
      canonicalRdeJson_(record.attributes);
    } catch (error) {
      throw makeRdeValidationError_(
        'RDE_RECORD_ATTRIBUTES_INVALID',
        'records[' + index + '].attributes deve conter somente valores JSON de dados.'
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
    if (definition && definition.ABSTRACT === true) {
      throw makeRdeValidationError_(
        'RDE_ABSTRACT_ENTITY',
        'entity_id abstrato não pode materializar registro concreto: ' + record.entity_id
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
    if (Object.prototype.hasOwnProperty.call(record, 'provenance')) {
      try {
        canonicalRdeJson_(record.provenance);
      } catch (error) {
        throw makeRdeValidationError_(
          'RDE_RECORD_PROVENANCE_INVALID',
          'provenance deve conter somente valores JSON de dados.'
        );
      }
    }
    recordsById[record.record_id] = record;
    definitionsById[record.record_id] = definition;
  }

  for (let index = 0; index < records.length; index += 1) {
    const record = Object.getOwnPropertyDescriptor(records, String(index)).value;
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
  }

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
  for (let index = 0; index < records.length; index += 1) {
    const record = Object.getOwnPropertyDescriptor(records, String(index)).value;
    visit(record.record_id);
  }
  return true;
}

function canonicalRdeJson_(value, active) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return RDE_INTRINSIC_JSON_STRINGIFY_(value);
  }
  if (typeof value === 'number' && RDE_INTRINSIC_NUMBER_IS_FINITE_(value)) {
    return RDE_INTRINSIC_JSON_STRINGIFY_(value);
  }
  if (typeof value !== 'object') {
    throw makeRdeValidationError_(
      'RDE_ASSOCIATION_PROVENANCE_INVALID',
      'documentary_associations.provenance deve conter somente valores JSON.'
    );
  }
  const seen = active || new Set();
  if (RDE_INTRINSIC_APPLY_(RDE_INTRINSIC_SET_HAS_, seen, [value])) {
    throw makeRdeValidationError_(
      'RDE_ASSOCIATION_PROVENANCE_INVALID',
      'documentary_associations.provenance não pode conter ciclos.'
    );
  }
  RDE_INTRINSIC_APPLY_(RDE_INTRINSIC_SET_ADD_, seen, [value]);
  let serialized;
  if (RDE_INTRINSIC_IS_ARRAY_(value)) {
    if (RDE_INTRINSIC_GET_SYMBOLS_(value).length ||
        RDE_INTRINSIC_KEYS_(value).length !== value.length ||
        RDE_INTRINSIC_GET_NAMES_(value).length !== value.length + 1) {
      throw makeRdeValidationError_(
        'RDE_ASSOCIATION_PROVENANCE_INVALID',
        'Arrays em provenance devem conter somente posições indexadas.'
      );
    }
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(value, String(index));
      if (!descriptor || !rdeHasOwn_(descriptor, 'value')) {
        throw makeRdeValidationError_(
          'RDE_ASSOCIATION_PROVENANCE_INVALID',
          'Arrays em provenance devem conter somente valores de dados.'
        );
      }
    }
    const items = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(value, String(index));
      RDE_INTRINSIC_APPLY_(RDE_INTRINSIC_ARRAY_PUSH_, items,
        [canonicalRdeJson_(descriptor.value, seen)]);
    }
    serialized = '[' + RDE_INTRINSIC_APPLY_(RDE_INTRINSIC_ARRAY_JOIN_, items, [',']) + ']';
  } else if (isPlainRdeObject_(value)) {
    const keys = RDE_INTRINSIC_KEYS_(value);
    if (RDE_INTRINSIC_GET_SYMBOLS_(value).length ||
        RDE_INTRINSIC_GET_NAMES_(value).length !== keys.length) {
      throw makeRdeValidationError_(
        'RDE_ASSOCIATION_PROVENANCE_INVALID',
        'Objetos em provenance devem conter somente campos JSON enumeráveis.'
      );
    }
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      const descriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(value, key);
      if (!descriptor || !rdeHasOwn_(descriptor, 'value')) {
        throw makeRdeValidationError_(
          'RDE_ASSOCIATION_PROVENANCE_INVALID',
          'Provenance não pode conter propriedades calculadas.'
        );
      }
    }
    RDE_INTRINSIC_APPLY_(RDE_INTRINSIC_ARRAY_SORT_, keys, []);
    let fields = '';
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      const descriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(value, key);
      if (index > 0) fields += ',';
      fields += RDE_INTRINSIC_JSON_STRINGIFY_(key) + ':' +
        canonicalRdeJson_(descriptor.value, seen);
    }
    serialized = '{' + fields + '}';
  } else {
    RDE_INTRINSIC_APPLY_(RDE_INTRINSIC_SET_DELETE_, seen, [value]);
    throw makeRdeValidationError_(
      'RDE_ASSOCIATION_PROVENANCE_INVALID',
      'documentary_associations.provenance deve conter somente objetos simples.'
    );
  }
  RDE_INTRINSIC_APPLY_(RDE_INTRINSIC_SET_DELETE_, seen, [value]);
  return serialized;
}

function validateRdeDocumentaryAssociations_(associations, records, entityCatalog) {
  if (!Array.isArray(associations)) {
    throw makeRdeValidationError_(
      'RDE_ASSOCIATIONS_INVALID',
      'documentary_associations deve ser um array.'
    );
  }
  if (Object.getOwnPropertySymbols(associations).length ||
      Object.keys(associations).length !== associations.length ||
      Object.getOwnPropertyNames(associations).length !== associations.length + 1) {
    throw makeRdeValidationError_(
      'RDE_ASSOCIATIONS_INVALID',
      'documentary_associations deve ser um array denso sem propriedades extras.'
    );
  }
  const recordsById = Object.create(null);
  for (let index = 0; index < records.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(records, String(index));
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
      throw makeRdeValidationError_(
        'RDE_ASSOCIATION_ENDPOINT_DANGLING',
        'records deve conter registros de dados em todas as posições.'
      );
    }
    const record = descriptor.value;
    recordsById[record.record_id] = record;
  }
  const associationIds = Object.create(null);
  const structuralAssociations = Object.create(null);
  for (let index = 0; index < associations.length; index += 1) {
    const itemDescriptor = Object.getOwnPropertyDescriptor(associations, String(index));
    if (!itemDescriptor || !Object.prototype.hasOwnProperty.call(itemDescriptor, 'value')) {
      throw makeRdeValidationError_(
        'RDE_ASSOCIATIONS_INVALID',
        'documentary_associations deve conter itens de dados em todas as posições.'
      );
    }
    const association = itemDescriptor.value;
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
  }
  return true;
}

function validateRdeDrtDeclarationItems_(items, records, entityCatalog) {
  if (!Array.isArray(items)) {
    throw makeRdeValidationError_(
      'RDE_DRT_DECLARATIONS_INVALID',
      'drt_declaration_items deve ser um array.'
    );
  }
  if (Object.getOwnPropertySymbols(items).length ||
      Object.keys(items).length !== items.length ||
      Object.getOwnPropertyNames(items).length !== items.length + 1) {
    throw makeRdeValidationError_(
      'RDE_DRT_DECLARATIONS_INVALID',
      'drt_declaration_items deve ser um array denso sem propriedades extras.'
    );
  }
  const recordsById = Object.create(null);
  for (let index = 0; index < records.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(records, String(index));
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
      throw makeRdeValidationError_(
        'RDE_DRT_DECLARATION_DRT_DANGLING',
        'records deve conter dados em todas as posições.'
      );
    }
    recordsById[descriptor.value.record_id] = descriptor.value;
  }
  const declarationIds = Object.create(null);
  const signatures = Object.create(null);
  for (let index = 0; index < items.length; index += 1) {
    const itemDescriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(items, String(index));
    if (!itemDescriptor || !Object.prototype.hasOwnProperty.call(itemDescriptor, 'value')) {
      throw makeRdeValidationError_(
        'RDE_DRT_DECLARATIONS_INVALID',
        'drt_declaration_items deve conter dados em todas as posições.'
      );
    }
    const item = itemDescriptor.value;
    if (!isPlainRdeObject_(item)) {
      throw makeRdeValidationError_(
        'RDE_DRT_DECLARATION_INVALID',
        'drt_declaration_items[' + index + '] deve ser um objeto simples.'
      );
    }
    const required = [
      'declaration_id', 'drt_record_id', 'activity_service_text',
      'smsci_scope_text', 'source_document', 'source_text'
    ];
    const allowed = required.concat(['provenance']);
    const keys = Object.keys(item);
    if (Object.getOwnPropertySymbols(item).length ||
        Object.getOwnPropertyNames(item).length !== keys.length ||
        keys.some(key => {
          const descriptor = Object.getOwnPropertyDescriptor(item, key);
          return !descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value');
        }) || required.some(key => !keys.includes(key)) ||
        keys.some(key => !allowed.includes(key))) {
      throw makeRdeValidationError_(
        'RDE_DRT_DECLARATION_INVALID',
        'drt_declaration_items[' + index + '] tem campos ausentes ou não declarados.'
      );
    }
    required.forEach(key => {
      if (typeof item[key] !== 'string' || !item[key].trim()) {
        throw makeRdeValidationError_(
          'RDE_DRT_DECLARATION_INVALID',
          'drt_declaration_items[' + index + '].' + key + ' deve ser texto literal não vazio.'
        );
      }
    });
    if (!item.source_text.includes(item.activity_service_text) ||
        !item.source_text.includes(item.smsci_scope_text)) {
      throw makeRdeValidationError_(
        'RDE_DRT_DECLARATION_TEXT_MISMATCH',
        'Os textos declarados devem ocorrer literalmente em source_text.'
      );
    }
    if (Object.prototype.hasOwnProperty.call(declarationIds, item.declaration_id)) {
      throw makeRdeValidationError_(
        'RDE_DRT_DECLARATION_ID_DUPLICATE',
        'declaration_id duplicado: ' + item.declaration_id
      );
    }
    declarationIds[item.declaration_id] = true;
    const drt = recordsById[item.drt_record_id];
    if (!drt) {
      throw makeRdeValidationError_(
        'RDE_DRT_DECLARATION_DRT_DANGLING',
        'drt_record_id deve resolver para DRT na mesma RDE.'
      );
    }
    const drtDefinition = entityCatalog[drt.entity_id];
    if (!drtDefinition ||
        drtDefinition.TYPE !== 'DOCUMENT' ||
        drtDefinition.EXTENDS !== 'DRT' ||
        drtDefinition.ABSTRACT === true) {
      throw makeRdeValidationError_(
        'RDE_DRT_DECLARATION_DRT_TYPE_INVALID',
        'drt_record_id deve resolver para documento concreto TYPE DOCUMENT EXTENDS DRT.'
      );
    }
    const source = recordsById[item.source_document];
    const sourceDefinition = source && entityCatalog[source.entity_id];
    if (!source || !sourceDefinition || sourceDefinition.TYPE !== 'DOCUMENT') {
      throw makeRdeValidationError_(
        'RDE_DRT_DECLARATION_SOURCE_INVALID',
        'source_document deve resolver para TYPE DOCUMENT na mesma RDE.'
      );
    }
    if (item.source_document !== drt.source_document) {
      throw makeRdeValidationError_(
        'RDE_DRT_DECLARATION_SOURCE_MISMATCH',
        'source_document deve corresponder ao documento de origem da DRT.'
      );
    }
    let provenance = null;
    const hasProvenance = Object.prototype.hasOwnProperty.call(item, 'provenance');
    if (hasProvenance && item.provenance !== null && !isPlainRdeObject_(item.provenance)) {
      throw makeRdeValidationError_(
        'RDE_DRT_DECLARATION_PROVENANCE_INVALID',
        'provenance deve ser objeto simples quando informada.'
      );
    }
    if (hasProvenance) {
      try {
        provenance = canonicalRdeJson_(item.provenance);
      } catch (error) {
        throw makeRdeValidationError_(
          'RDE_DRT_DECLARATION_PROVENANCE_INVALID',
          'provenance deve conter somente valores JSON simples.'
        );
      }
    }
    const signature = canonicalRdeJson_({
      drt_record_id: item.drt_record_id,
      activity_service_text: item.activity_service_text,
      smsci_scope_text: item.smsci_scope_text,
      source_document: item.source_document,
      source_text: item.source_text,
      has_provenance: hasProvenance,
      provenance
    });
    if (Object.prototype.hasOwnProperty.call(signatures, signature)) {
      throw makeRdeValidationError_(
        'RDE_DRT_DECLARATION_DUPLICATE',
        'Uma declaração documental estruturalmente idêntica já foi registrada.'
      );
    }
    signatures[signature] = true;
  }
  return true;
}

function validateRdeDocumentaryDateItems_(items, records, entityCatalog) {
  if (!Array.isArray(items)) {
    throw makeRdeValidationError_('RDE_DOCUMENTARY_DATES_INVALID',
      'documentary_date_items deve ser um array.');
  }
  if (Object.getOwnPropertySymbols(items).length || Object.keys(items).length !== items.length ||
      Object.getOwnPropertyNames(items).length !== items.length + 1) {
    throw makeRdeValidationError_('RDE_DOCUMENTARY_DATES_INVALID',
      'documentary_date_items deve ser um array denso sem propriedades extras.');
  }
  const recordsById = Object.create(null);
  for (let index = 0; index < records.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(records, String(index));
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
      throw makeRdeValidationError_('RDE_DOCUMENTARY_DATE_PRODUCT_DANGLING',
        'records deve conter dados em todas as posições.');
    }
    recordsById[descriptor.value.record_id] = descriptor.value;
  }
  const itemIds = Object.create(null);
  for (let index = 0; index < items.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(items, String(index));
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
      throw makeRdeValidationError_('RDE_DOCUMENTARY_DATES_INVALID',
        'documentary_date_items deve conter dados em todas as posições.');
    }
    const item = descriptor.value;
    if (!isPlainRdeObject_(item)) {
      throw makeRdeValidationError_('RDE_DOCUMENTARY_DATE_INVALID',
        'documentary_date_items[' + index + '] deve ser um objeto simples.');
    }
    const required = ['date_item_id', 'product_record_id', 'date_label_text', 'date_text',
      'source_document', 'source_text'];
    const allowed = required.concat(['provenance']);
    const keys = Object.keys(item);
    if (Object.getOwnPropertySymbols(item).length ||
        Object.getOwnPropertyNames(item).length !== keys.length ||
        keys.some(key => {
          const field = Object.getOwnPropertyDescriptor(item, key);
          return !field || !Object.prototype.hasOwnProperty.call(field, 'value');
        }) || required.some(key => !keys.includes(key)) || keys.some(key => !allowed.includes(key))) {
      throw makeRdeValidationError_('RDE_DOCUMENTARY_DATE_INVALID',
        'documentary_date_items[' + index + '] tem campos ausentes ou não declarados.');
    }
    required.forEach(key => {
      if (typeof item[key] !== 'string' || !item[key].trim()) {
        throw makeRdeValidationError_('RDE_DOCUMENTARY_DATE_INVALID',
          'documentary_date_items[' + index + '].' + key + ' deve ser texto literal não vazio.');
      }
    });
    if (!item.source_text.includes(item.date_label_text) ||
        !item.source_text.includes(item.date_text)) {
      throw makeRdeValidationError_('RDE_DOCUMENTARY_DATE_TEXT_MISMATCH',
        'date_label_text e date_text devem ocorrer literalmente em source_text.');
    }
    if (Object.prototype.hasOwnProperty.call(itemIds, item.date_item_id)) {
      throw makeRdeValidationError_('RDE_DOCUMENTARY_DATE_ID_DUPLICATE',
        'date_item_id duplicado: ' + item.date_item_id);
    }
    itemIds[item.date_item_id] = true;
    const product = recordsById[item.product_record_id];
    if (!product) {
      throw makeRdeValidationError_('RDE_DOCUMENTARY_DATE_PRODUCT_DANGLING',
        'product_record_id deve resolver para TEST_REPORT na mesma RDE.');
    }
    const productDefinition = entityCatalog[product.entity_id];
    if (!productDefinition || productDefinition.TYPE !== 'TEST_REPORT') {
      throw makeRdeValidationError_('RDE_DOCUMENTARY_DATE_PRODUCT_TYPE_INVALID',
        'product_record_id deve resolver exatamente para TYPE TEST_REPORT.');
    }
    const source = recordsById[item.source_document];
    const sourceDefinition = source && entityCatalog[source.entity_id];
    if (!source || !sourceDefinition || sourceDefinition.TYPE !== 'DOCUMENT') {
      throw makeRdeValidationError_('RDE_DOCUMENTARY_DATE_SOURCE_INVALID',
        'source_document deve resolver para TYPE DOCUMENT na mesma RDE.');
    }
    if (item.source_document !== product.source_document) {
      throw makeRdeValidationError_('RDE_DOCUMENTARY_DATE_SOURCE_MISMATCH',
        'source_document deve corresponder ao documento de origem do produto.');
    }
    if (Object.prototype.hasOwnProperty.call(item, 'provenance')) {
      if (item.provenance !== null && !isPlainRdeObject_(item.provenance)) {
        throw makeRdeValidationError_('RDE_DOCUMENTARY_DATE_PROVENANCE_INVALID',
          'provenance deve ser objeto simples quando informada.');
      }
      try {
        canonicalRdeJson_(item.provenance);
      } catch (error) {
        throw makeRdeValidationError_('RDE_DOCUMENTARY_DATE_PROVENANCE_INVALID',
          'provenance deve conter somente valores JSON simples.');
      }
    }
  }
  return true;
}

function validateRdeActivityItems_(items, records, entityCatalog) {
  if (!RDE_INTRINSIC_IS_ARRAY_(items) || RDE_INTRINSIC_GET_SYMBOLS_(items).length ||
      RDE_INTRINSIC_KEYS_(items).length !== items.length ||
      RDE_INTRINSIC_GET_NAMES_(items).length !== items.length + 1) {
    throw makeRdeValidationError_('RDE_ACTIVITY_ITEMS_INVALID',
      'drt_activity_items deve ser um array denso sem propriedades extras.');
  }
  for (let index = 0; index < items.length; index += 1) {
    const descriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(items, String(index));
    if (!descriptor || !rdeHasOwn_(descriptor, 'value')) {
      throw makeRdeValidationError_('RDE_ACTIVITY_ITEMS_INVALID', 'drt_activity_items deve conter dados em todas as posições.');
    }
  }
  const recordsById = Object.create(null);
  for (let index = 0; index < records.length; index += 1) {
    const descriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(records, String(index));
    if (!descriptor || !rdeHasOwn_(descriptor, 'value')) {
      throw makeRdeValidationError_('RDE_ACTIVITY_ITEMS_INVALID', 'records deve conter dados em todas as posições.');
    }
    recordsById[descriptor.value.record_id] = descriptor.value;
  }
  const itemIds = Object.create(null);
  const signatures = Object.create(null);
  const required = ['activity_item_id', 'drt_record_id', 'activity_service_text', 'source_document', 'source_text'];
  const optional = ['provenance'];
  const hasKey = (list, key) => {
    for (let index = 0; index < list.length; index += 1) if (list[index] === key) return true;
    return false;
  };
  for (let index = 0; index < items.length; index += 1) {
    const itemDescriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(items, String(index));
    if (!itemDescriptor || !rdeHasOwn_(itemDescriptor, 'value')) {
      throw makeRdeValidationError_('RDE_ACTIVITY_ITEMS_INVALID', 'drt_activity_items deve conter dados em todas as posições.');
    }
    const item = itemDescriptor.value;
    if (!isPlainRdeObject_(item)) throw makeRdeValidationError_('RDE_ACTIVITY_ITEM_INVALID',
      'drt_activity_items[' + index + '] deve ser um objeto simples.');
    const keys = RDE_INTRINSIC_KEYS_(item);
    let unsupportedKey = false;
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
      if (!hasKey(required, keys[keyIndex]) && !hasKey(optional, keys[keyIndex])) unsupportedKey = true;
    }
    if (RDE_INTRINSIC_GET_SYMBOLS_(item).length ||
        RDE_INTRINSIC_GET_NAMES_(item).length !== keys.length || unsupportedKey) {
      throw makeRdeValidationError_('RDE_ACTIVITY_ITEM_INVALID',
        'drt_activity_items[' + index + '] tem campos ausentes ou não declarados.');
    }
    const fieldValues = Object.create(null);
    for (let keyIndex = 0; keyIndex < required.length; keyIndex += 1) {
      const key = required[keyIndex];
      const descriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(item, key);
      if (!descriptor || !rdeHasOwn_(descriptor, 'value') || !rdeNonBlankText_(descriptor.value)) {
        throw makeRdeValidationError_('RDE_ACTIVITY_ITEM_INVALID', key + ' deve ser texto literal não vazio.');
      }
      fieldValues[key] = descriptor.value;
    }
    if (rdeLiteralIndexOf_(fieldValues.source_text, fieldValues.activity_service_text) === -1) {
      throw makeRdeValidationError_('RDE_ACTIVITY_ITEM_TEXT_MISMATCH', 'activity_service_text deve ocorrer literalmente em source_text.');
    }
    if (rdeHasOwn_(itemIds, fieldValues.activity_item_id)) throw makeRdeValidationError_('RDE_ACTIVITY_ITEM_ID_DUPLICATE', 'activity_item_id duplicado.');
    itemIds[fieldValues.activity_item_id] = true;
    const drt = recordsById[fieldValues.drt_record_id];
    const drtDefinition = drt && rdeHasOwn_(entityCatalog, drt.entity_id)
      ? entityCatalog[drt.entity_id] : null;
    if (!drt || !rdeHasOwn_(recordsById, fieldValues.drt_record_id)) throw makeRdeValidationError_('RDE_ACTIVITY_ITEM_DRT_DANGLING', 'drt_record_id deve resolver na mesma RDE.');
    if (!drtDefinition || drtDefinition.TYPE !== 'DOCUMENT' || drtDefinition.EXTENDS !== 'DRT' || drtDefinition.ABSTRACT === true) {
      throw makeRdeValidationError_('RDE_ACTIVITY_ITEM_DRT_TYPE_INVALID', 'drt_record_id deve resolver para DRT concreto.');
    }
    const source = recordsById[fieldValues.source_document];
    if (!source || !rdeHasOwn_(recordsById, fieldValues.source_document) ||
        !rdeHasOwn_(entityCatalog, source.entity_id) ||
        entityCatalog[source.entity_id].TYPE !== 'DOCUMENT') {
      throw makeRdeValidationError_('RDE_ACTIVITY_ITEM_SOURCE_INVALID', 'source_document deve resolver para DOCUMENT.');
    }
    if (fieldValues.source_document !== drt.source_document) throw makeRdeValidationError_('RDE_ACTIVITY_ITEM_SOURCE_MISMATCH', 'source_document deve corresponder à origem da DRT.');
    const provenanceDescriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(item, 'provenance');
    const hasProvenance = !!provenanceDescriptor;
    if (hasProvenance && !rdeHasOwn_(provenanceDescriptor, 'value')) {
      throw makeRdeValidationError_('RDE_ACTIVITY_ITEM_PROVENANCE_INVALID', 'provenance não pode ser accessor.');
    }
    const provenanceValue = hasProvenance ? provenanceDescriptor.value : null;
    if (hasProvenance && provenanceValue !== null && !isPlainRdeObject_(provenanceValue)) throw makeRdeValidationError_('RDE_ACTIVITY_ITEM_PROVENANCE_INVALID', 'provenance deve ser objeto simples.');
    let provenance = null;
    if (hasProvenance) { try { provenance = canonicalRdeJson_(provenanceValue); } catch (error) { throw makeRdeValidationError_('RDE_ACTIVITY_ITEM_PROVENANCE_INVALID', 'provenance deve conter somente valores JSON simples.'); } }
    const signature = canonicalRdeJson_({ drt_record_id: fieldValues.drt_record_id, activity_service_text: fieldValues.activity_service_text, source_document: fieldValues.source_document, source_text: fieldValues.source_text, hasProvenance, provenance });
    if (rdeHasOwn_(signatures, signature)) throw makeRdeValidationError_('RDE_ACTIVITY_ITEM_DUPLICATE', 'item de atividade estruturalmente idêntico já registrado.');
    signatures[signature] = true;
  }
  return true;
}

function validateRdeDrtScopeDeclarationItems_(items, records, entityCatalog) {
  if (!RDE_INTRINSIC_IS_ARRAY_(items) || RDE_INTRINSIC_GET_SYMBOLS_(items).length ||
      RDE_INTRINSIC_KEYS_(items).length !== items.length ||
      RDE_INTRINSIC_GET_NAMES_(items).length !== items.length + 1) {
    throw makeRdeValidationError_('RDE_DRT_SCOPE_ITEMS_INVALID',
      'drt_scope_declaration_items deve ser um array denso sem propriedades extras.');
  }
  const recordsById = RDE_INTRINSIC_CREATE_(null);
  for (let index = 0; index < records.length; index += 1) {
    const descriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(records, String(index));
    if (!descriptor || !rdeHasOwn_(descriptor, 'value')) {
      throw makeRdeValidationError_('RDE_DRT_SCOPE_ENDPOINT_INVALID', 'records deve conter dados em todas as posições.');
    }
    recordsById[descriptor.value.record_id] = descriptor.value;
  }
  const ids = RDE_INTRINSIC_CREATE_(null);
  const signatures = RDE_INTRINSIC_CREATE_(null);
  const required = ['scope_declaration_item_id', 'drt_record_id', 'drt_reference_text',
    'product_record_id', 'product_reference_text', 'smsci_text', 'activity_service_text',
    'source_document', 'source_text'];
  const allowed = ['scope_declaration_item_id', 'drt_record_id', 'drt_reference_text',
    'product_record_id', 'product_reference_text', 'smsci_text', 'activity_service_text',
    'source_document', 'source_text', 'provenance'];
  for (let index = 0; index < items.length; index += 1) {
    const itemDescriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(items, String(index));
    if (!itemDescriptor || !rdeHasOwn_(itemDescriptor, 'value')) {
      throw makeRdeValidationError_('RDE_DRT_SCOPE_ITEMS_INVALID', 'drt_scope_declaration_items deve ser denso.');
    }
    const item = itemDescriptor.value;
    if (!isPlainRdeObject_(item)) throw makeRdeValidationError_('RDE_DRT_SCOPE_ITEM_INVALID', 'item deve ser objeto simples.');
    const keys = RDE_INTRINSIC_KEYS_(item);
    let unsupportedKey = false;
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
      let declared = false;
      for (let allowedIndex = 0; allowedIndex < allowed.length; allowedIndex += 1) {
        if (keys[keyIndex] === allowed[allowedIndex]) declared = true;
      }
      if (!declared) unsupportedKey = true;
    }
    if (RDE_INTRINSIC_GET_SYMBOLS_(item).length || RDE_INTRINSIC_GET_NAMES_(item).length !== keys.length || unsupportedKey) {
      throw makeRdeValidationError_('RDE_DRT_SCOPE_ITEM_INVALID', 'item tem campos ausentes ou não declarados.');
    }
    const value = RDE_INTRINSIC_CREATE_(null);
    for (let requiredIndex = 0; requiredIndex < required.length; requiredIndex += 1) {
      const key = required[requiredIndex];
      const descriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(item, key);
      if (!descriptor || !rdeHasOwn_(descriptor, 'value') || !rdeNonBlankText_(descriptor.value)) {
        throw makeRdeValidationError_('RDE_DRT_SCOPE_ITEM_INVALID', key + ' deve ser literal não vazio.');
      }
      value[key] = descriptor.value;
    }
    if (rdeLiteralIndexOf_(value.source_text, value.drt_reference_text) === -1 ||
        rdeLiteralIndexOf_(value.source_text, value.product_reference_text) === -1 ||
        rdeLiteralIndexOf_(value.source_text, value.smsci_text) === -1 ||
        rdeLiteralIndexOf_(value.source_text, value.activity_service_text) === -1) {
      throw makeRdeValidationError_('RDE_DRT_SCOPE_TEXT_MISMATCH', 'as referências de DRT/produto e os textos SMSCI/atividade devem ocorrer literalmente em source_text.');
    }
    if (rdeHasOwn_(ids, value.scope_declaration_item_id)) {
      throw makeRdeValidationError_('RDE_DRT_SCOPE_ITEM_ID_DUPLICATE', 'scope_declaration_item_id duplicado.');
    }
    ids[value.scope_declaration_item_id] = true;
    const drt = recordsById[value.drt_record_id];
    const drtType = drt && rdeHasOwn_(entityCatalog, drt.entity_id) ? entityCatalog[drt.entity_id] : null;
    if (!drt) throw makeRdeValidationError_('RDE_DRT_SCOPE_DRT_DANGLING', 'drt_record_id órfão.');
    if (!drtType || drtType.TYPE !== 'DOCUMENT' || drtType.EXTENDS !== 'DRT' || drtType.ABSTRACT === true) {
      throw makeRdeValidationError_('RDE_DRT_SCOPE_DRT_TYPE_INVALID', 'drt_record_id deve ser DRT concreto.');
    }
    const product = recordsById[value.product_record_id];
    const productType = product && rdeHasOwn_(entityCatalog, product.entity_id) ? entityCatalog[product.entity_id] : null;
    if (!product) throw makeRdeValidationError_('RDE_DRT_SCOPE_PRODUCT_DANGLING', 'product_record_id órfão.');
    const productTypes = ['DOCUMENT', 'REPORT', 'TEST_REPORT', 'COMMISSIONING_REPORT'];
    let productTypeAllowed = false;
    for (let typeIndex = 0; typeIndex < productTypes.length; typeIndex += 1) {
      if (productType && productType.TYPE === productTypes[typeIndex]) productTypeAllowed = true;
    }
    if (!productTypeAllowed || (productType.TYPE === 'DOCUMENT' &&
        (productType.EXTENDS === 'DRT' || productType.ABSTRACT === true))) {
      throw makeRdeValidationError_('RDE_DRT_SCOPE_PRODUCT_TYPE_INVALID', 'product_record_id não é produto/documento concreto.');
    }
    const source = recordsById[value.source_document];
    if (!source || !rdeHasOwn_(entityCatalog, source.entity_id) || entityCatalog[source.entity_id].TYPE !== 'DOCUMENT') {
      throw makeRdeValidationError_('RDE_DRT_SCOPE_SOURCE_INVALID', 'source_document deve resolver para DOCUMENT.');
    }
    const provenanceDescriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(item, 'provenance');
    const hasProvenance = !!provenanceDescriptor;
    if (hasProvenance && !rdeHasOwn_(provenanceDescriptor, 'value')) {
      throw makeRdeValidationError_('RDE_DRT_SCOPE_PROVENANCE_INVALID', 'provenance não pode ser accessor.');
    }
    const provenanceValue = hasProvenance ? provenanceDescriptor.value : null;
    if (hasProvenance && (!isPlainRdeObject_(provenanceValue) ||
        RDE_INTRINSIC_KEYS_(provenanceValue).length === 0)) {
      throw makeRdeValidationError_('RDE_DRT_SCOPE_PROVENANCE_INVALID', 'provenance deve ser objeto simples não vazio.');
    }
    let provenance = null;
    if (hasProvenance) {
      try { provenance = canonicalRdeJson_(provenanceValue); } catch (error) {
        throw makeRdeValidationError_('RDE_DRT_SCOPE_PROVENANCE_INVALID', 'provenance deve conter somente JSON simples.');
      }
    }
    const signature = canonicalRdeJson_({
      drt_record_id: value.drt_record_id, product_record_id: value.product_record_id,
      drt_reference_text: value.drt_reference_text, product_reference_text: value.product_reference_text,
      smsci_text: value.smsci_text, activity_service_text: value.activity_service_text,
      source_document: value.source_document, source_text: value.source_text, provenance
    });
    if (rdeHasOwn_(signatures, signature)) throw makeRdeValidationError_('RDE_DRT_SCOPE_ITEM_DUPLICATE', 'item de escopo duplicado.');
    signatures[signature] = true;
  }
  return true;
}

/** Valida RDE 0.2.0-0.7.0 sem executar Requirements ou Criteria. */
function validateRdeStructure_(rde, expected, entityCatalog) {
  requireRdeObject_(rde, 'RDE');

  const schemaDescriptor = Object.getOwnPropertyDescriptor(rde, 'schema_version');
  if (!schemaDescriptor || !Object.prototype.hasOwnProperty.call(schemaDescriptor, 'value') ||
      !isSupportedRdeSchemaVersion_(schemaDescriptor.value)) {
    throw makeRdeValidationError_(
      'RDE_SCHEMA_VERSION_MISMATCH',
      'schema_version deve ser 0.7.0, 0.6.0, 0.5.0, 0.4.0, 0.3.0 ou 0.2.0.'
    );
  }
  const schemaVersion = schemaDescriptor.value;

  const expectedEnvelopeKeys = [
    'schema_version', 'process_id', 'source', 'extraction', 'records', 'extraction_warnings'
  ];
  if (schemaVersion === RDE_SCHEMA_VERSION) {
    expectedEnvelopeKeys.push('documentary_associations');
    expectedEnvelopeKeys.push('drt_declaration_items');
    expectedEnvelopeKeys.push('documentary_date_items');
    expectedEnvelopeKeys.push('drt_activity_items');
    expectedEnvelopeKeys.push('drt_scope_declaration_items');
  } else if (schemaVersion === RDE_PREVIOUS_SCHEMA_VERSION) {
    expectedEnvelopeKeys.push('documentary_associations');
    expectedEnvelopeKeys.push('drt_declaration_items');
    expectedEnvelopeKeys.push('documentary_date_items');
    expectedEnvelopeKeys.push('drt_activity_items');
  } else if (schemaVersion === '0.5.0') {
    expectedEnvelopeKeys.push('documentary_associations');
    expectedEnvelopeKeys.push('drt_declaration_items');
    expectedEnvelopeKeys.push('documentary_date_items');
  } else if (schemaVersion === '0.4.0') {
    expectedEnvelopeKeys.push('documentary_associations');
    expectedEnvelopeKeys.push('drt_declaration_items');
  } else if (schemaVersion === RDE_LEGACY_SCHEMA_VERSION) {
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

  if (schemaVersion === RDE_SCHEMA_VERSION ||
      schemaVersion === RDE_PREVIOUS_SCHEMA_VERSION ||
      schemaVersion === RDE_LEGACY_SCHEMA_VERSION ||
      schemaVersion === '0.4.0' || schemaVersion === '0.5.0') {
    const associationsDescriptor = Object.getOwnPropertyDescriptor(rde, 'documentary_associations');
    validateRdeDocumentaryAssociations_(associationsDescriptor.value, rde.records, entityCatalog);
  }
  if (schemaVersion === RDE_SCHEMA_VERSION || schemaVersion === RDE_PREVIOUS_SCHEMA_VERSION ||
      schemaVersion === '0.4.0' || schemaVersion === '0.5.0') {
    const declarationsDescriptor = Object.getOwnPropertyDescriptor(rde, 'drt_declaration_items');
    validateRdeDrtDeclarationItems_(declarationsDescriptor.value, rde.records, entityCatalog);
  }
  if (schemaVersion === RDE_SCHEMA_VERSION || schemaVersion === RDE_PREVIOUS_SCHEMA_VERSION ||
      schemaVersion === '0.5.0') {
    const datesDescriptor = Object.getOwnPropertyDescriptor(rde, 'documentary_date_items');
    validateRdeDocumentaryDateItems_(datesDescriptor.value, rde.records, entityCatalog);
  }
  if (schemaVersion === RDE_SCHEMA_VERSION || schemaVersion === RDE_PREVIOUS_SCHEMA_VERSION) {
    const activitiesDescriptor = Object.getOwnPropertyDescriptor(rde, 'drt_activity_items');
    validateRdeActivityItems_(activitiesDescriptor.value, rde.records, entityCatalog);
  }
  if (schemaVersion === RDE_SCHEMA_VERSION) {
    const scopeItemsDescriptor = Object.getOwnPropertyDescriptor(rde, 'drt_scope_declaration_items');
    validateRdeDrtScopeDeclarationItems_(scopeItemsDescriptor.value, rde.records, entityCatalog);
  }

  if (!Array.isArray(rde.extraction_warnings)) {
    throw makeRdeValidationError_(
      'RDE_INVALID_FIELD_TYPE',
      'extraction_warnings deve ser um array.'
    );
  }

  return rde;
}

(function installValidatedExecutionRdeBoundary_(global) {
  'use strict';
  const validatedRdes = new WeakSet();
  const validatedRdeDigests = new WeakMap();
  const weakSetAdd = RDE_INTRINSIC_WEAKSET_ADD_;
  const weakSetHas = RDE_INTRINSIC_WEAKSET_HAS_;
  const weakMapGet = WeakMap.prototype.get;
  const weakMapSet = WeakMap.prototype.set;
  const weakMapHas = WeakMap.prototype.has;
  const apply = RDE_INTRINSIC_APPLY_;
  const digestValidatedRde = validatedRdeDigest_;

  function freezeJsonTree(value) {
    if (!value || typeof value !== 'object' || RDE_INTRINSIC_IS_ARRAY_(value) && value.length === 0) {
      return RDE_INTRINSIC_FREEZE_(value);
    }
    const keys = RDE_INTRINSIC_KEYS_(value);
    for (let index = 0; index < keys.length; index += 1) {
      const descriptor = RDE_INTRINSIC_GET_DESCRIPTOR_(value, keys[index]);
      if (!descriptor || !apply(RDE_INTRINSIC_HAS_OWN_, descriptor, ['value'])) {
        throw makeRdeValidationError_('RDE_INVALID_DATA', 'RDE parsed data cannot contain accessors.');
      }
      freezeJsonTree(descriptor.value);
    }
    return RDE_INTRINSIC_FREEZE_(value);
  }

  function parseAndValidateOperationalRdeJson_(content, expected, entityCatalog) {
    let rde;
    try {
      rde = RDE_INTRINSIC_JSON_PARSE_(content);
    } catch (error) {
      throw makeRdeValidationError_(
        'RDE_INVALID_JSON',
        'O arquivo da RDE não contém JSON válido.'
      );
    }
    freezeJsonTree(rde);
    // Freeze the parser-owned JSON before legacy structural helpers inspect it.
    // Even if a mutable Array/Object intrinsic is patched, its callbacks cannot
    // rewrite documentary facts between parsing and view projection.
    validateRdeStructure_(rde, expected, entityCatalog);
    const digest = digestValidatedRde(rde);
    apply(weakSetAdd, validatedRdes, [rde]);
    apply(weakMapSet, validatedRdeDigests, [rde, digest]);
    return rde;
  }

  RDE_INTRINSIC_DEFINE_PROPERTY_(global, 'parseAndValidateOperationalRdeJson_', {
    value: parseAndValidateOperationalRdeJson_, enumerable: true,
    writable: false, configurable: false
  });
  RDE_INTRINSIC_DEFINE_PROPERTY_(global, 'isCanonicalValidatedExecutionRde_', {
    value: function (candidate) { return apply(weakSetHas, validatedRdes, [candidate]); },
    enumerable: false, writable: false, configurable: false
  });
  RDE_INTRINSIC_DEFINE_PROPERTY_(global, 'isCanonicalValidatedRdeDigest_', {
    value: function (rde, digest) {
      return apply(weakSetHas, validatedRdes, [rde]) &&
        apply(weakMapGet, validatedRdeDigests, [rde]) === digest;
    },
    enumerable: false, writable: false, configurable: false
  });
  RDE_INTRINSIC_DEFINE_PROPERTY_(global, 'getValidatedRdeDigest_', {
    value: function (rde) {
      if (!apply(weakSetHas, validatedRdes, [rde]) || !apply(weakMapHas, validatedRdeDigests, [rde])) {
        throw new Error('validated RDE digest requires parser-authenticated RDE');
      }
      return apply(weakMapGet, validatedRdeDigests, [rde]);
    },
    enumerable: false, writable: false, configurable: false
  });
})(globalThis);

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

lockRdeValidationHelpers_();
