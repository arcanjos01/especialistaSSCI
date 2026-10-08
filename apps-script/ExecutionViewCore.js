/* Immutable view over entries produced by an authorized projection. */

class ExecutionViewContractError extends Error {}
class ExecutionViewLookupError extends ExecutionViewContractError {}

const EXECUTION_VIEW_RECORDS = new WeakMap();

function executionReferenceKey(reference) {
  if (!(reference instanceof TypedReference)) {
    throw new ExecutionViewContractError('reference must be a TypedReference');
  }
  return JSON.stringify([reference.kind, reference.identifier]);
}

function isPlainExecutionObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  let current = value;
  while (current !== null) {
    if (Object.getOwnPropertyDescriptor(current, Symbol.toStringTag)) return false;
    current = Object.getPrototypeOf(current);
  }
  if (Object.prototype.toString.call(value) !== '[object Object]') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}

function immutableExecutionCopy(value, active = []) {
  if (value instanceof TypedReference) return value;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (Array.isArray(value)) {
    if (active.includes(value)) {
      throw new ExecutionViewContractError('cyclic projection values are not supported');
    }
    if (Object.getOwnPropertySymbols(value).length || Object.keys(value).length !== value.length) {
      throw new ExecutionViewContractError('projection arrays must contain only indexed values');
    }
    const nextActive = active.concat([value]);
    const copy = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw new ExecutionViewContractError('projection arrays must contain data values');
      }
      copy.push(immutableExecutionCopy(descriptor.value, nextActive));
    }
    return Object.freeze(copy);
  }

  if (isPlainExecutionObject(value)) {
    if (active.includes(value)) {
      throw new ExecutionViewContractError('cyclic projection values are not supported');
    }
    if (Object.getOwnPropertySymbols(value).length) {
      throw new ExecutionViewContractError('projection objects cannot contain symbol keys');
    }
    const nextActive = active.concat([value]);
    const copy = {};
    Object.keys(value).sort().forEach(key => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw new ExecutionViewContractError('projection objects must contain data values');
      }
      Object.defineProperty(copy, key, {
        value: immutableExecutionCopy(descriptor.value, nextActive),
        enumerable: true,
        writable: false,
        configurable: false
      });
    });
    return Object.freeze(copy);
  }

  throw new ExecutionViewContractError(
    'projection values must be JSON-like values or TypedReference'
  );
}

function executionViewRecord(view, reference) {
  const state = EXECUTION_VIEW_RECORDS.get(view);
  if (!state) throw new ExecutionViewContractError('invalid execution view receiver');
  const key = executionReferenceKey(reference);
  if (!Object.prototype.hasOwnProperty.call(state.byReference, key)) {
    throw new ExecutionViewLookupError('reference not found: ' + reference.kind + ':' + reference.identifier);
  }
  return state.byReference[key];
}

/**
 * Read-only Process Memory over canonical records projected from RDE 0.2.0/0.3.0.
 * Only attributes are exposed by read(); structural relations use dedicated APIs.
 */
class ImmutableExecutionView {
  constructor(projectionEntries, associationEntries = [], schemaVersion = '0.2.0') {
    if (!Array.isArray(projectionEntries)) {
      throw new ExecutionViewContractError('projectionEntries must be an array');
    }
    if (Object.getOwnPropertySymbols(projectionEntries).length ||
        Object.keys(projectionEntries).length !== projectionEntries.length) {
      throw new ExecutionViewContractError('projectionEntries must be a dense array');
    }
    if (!Array.isArray(associationEntries) ||
        Object.getOwnPropertySymbols(associationEntries).length ||
        Object.keys(associationEntries).length !== associationEntries.length) {
      throw new ExecutionViewContractError('associationEntries must be a dense array');
    }
    for (let index = 0; index < associationEntries.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(associationEntries, String(index));
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw new ExecutionViewContractError('associationEntries must contain data entries');
      }
    }
    if (!['0.2.0', '0.3.0'].includes(schemaVersion)) {
      throw new ExecutionViewContractError('unsupported execution view schemaVersion');
    }
    if (schemaVersion === '0.2.0' && associationEntries.length) {
      throw new ExecutionViewContractError('RDE 0.2.0 cannot contain documentary associations');
    }
    const records = Object.create(null);
    const orderedReferences = [];
    const recordIds = Object.create(null);
    for (let index = 0; index < projectionEntries.length; index += 1) {
      const itemDescriptor = Object.getOwnPropertyDescriptor(projectionEntries, String(index));
      if (!itemDescriptor || !Object.prototype.hasOwnProperty.call(itemDescriptor, 'value')) {
        throw new ExecutionViewContractError('projectionEntries must contain data entries');
      }
      const entry = itemDescriptor.value;
      if (!isPlainExecutionObject(entry)) {
        throw new ExecutionViewContractError('projection entry must be an object');
      }
      const keys = Object.keys(entry).sort();
      if (Object.getOwnPropertySymbols(entry).length ||
          Object.getOwnPropertyNames(entry).length !== keys.length ||
          keys.some(key => !Object.prototype.hasOwnProperty.call(
            Object.getOwnPropertyDescriptor(entry, key), 'value'
          ))) {
        throw new ExecutionViewContractError('projection entries must contain only enumerable data fields');
      }
      const required = ['reference', 'entityId', 'parent', 'sourceDocument', 'value'];
      const allowed = required.concat(['provenance']);
      if (required.some(key => !keys.includes(key)) ||
          keys.some(key => !allowed.includes(key))) {
        throw new ExecutionViewContractError(
          'projection entry requires reference, entityId, parent, sourceDocument and value'
        );
      }
      const key = executionReferenceKey(entry.reference);
      if (Object.prototype.hasOwnProperty.call(records, key)) {
        throw new ExecutionViewContractError(
          'duplicate reference: ' + entry.reference.kind + ':' + entry.reference.identifier
        );
      }
      if (Object.prototype.hasOwnProperty.call(recordIds, entry.reference.identifier)) {
        throw new ExecutionViewContractError('duplicate record_id: ' + entry.reference.identifier);
      }
      if (typeof entry.entityId !== 'string' || !entry.entityId) {
        throw new ExecutionViewContractError('entityId must be a non-empty string');
      }
      if (entry.parent !== null && !(entry.parent instanceof TypedReference)) {
        throw new ExecutionViewContractError('parent must be a TypedReference or null');
      }
      if (!(entry.sourceDocument instanceof TypedReference) ||
          entry.sourceDocument.kind !== 'DOCUMENT') {
        throw new ExecutionViewContractError('sourceDocument must reference a DOCUMENT');
      }
      if (entry.reference.kind === 'DOCUMENT' &&
          (entry.parent !== null || executionReferenceKey(entry.sourceDocument) !== key)) {
        throw new ExecutionViewContractError('DOCUMENT must be root and self-source');
      }
      if (entry.reference.kind === 'DOCUMENT_SECTION' &&
          (!entry.parent || entry.parent.kind !== 'DOCUMENT')) {
        throw new ExecutionViewContractError('DOCUMENT_SECTION must have a DOCUMENT parent');
      }
      if (entry.reference.kind === 'DOCUMENTARY_EVIDENCE' && entry.parent !== null &&
          entry.parent.kind !== 'DOCUMENT_SECTION') {
        throw new ExecutionViewContractError(
          'DOCUMENTARY_EVIDENCE parent, when present, must be a DOCUMENT_SECTION'
        );
      }
      const hasProvenance = Object.prototype.hasOwnProperty.call(entry, 'provenance');
      const record = {
        reference: entry.reference,
        entityId: entry.entityId,
        parent: entry.parent,
        sourceDocument: entry.sourceDocument,
        value: immutableExecutionCopy(entry.value),
        hasProvenance,
        provenance: hasProvenance ? immutableExecutionCopy(entry.provenance) : undefined
      };
      Object.freeze(record);
      Object.defineProperty(records, key, {
        value: record, enumerable: true, writable: false, configurable: false
      });
      recordIds[entry.reference.identifier] = true;
      orderedReferences.push(entry.reference);
    }
    orderedReferences.forEach(reference => {
      const record = records[executionReferenceKey(reference)];
      if (!Object.prototype.hasOwnProperty.call(records, executionReferenceKey(record.sourceDocument)) ||
          records[executionReferenceKey(record.sourceDocument)].reference.kind !== 'DOCUMENT') {
        throw new ExecutionViewContractError('sourceDocument reference is missing from the view');
      }
      if (record.parent &&
          !Object.prototype.hasOwnProperty.call(records, executionReferenceKey(record.parent))) {
        throw new ExecutionViewContractError('parent reference is missing from the view');
      }
      if (record.reference.kind === 'DOCUMENT_SECTION' &&
          executionReferenceKey(record.parent) !== executionReferenceKey(record.sourceDocument)) {
        throw new ExecutionViewContractError('section parent and sourceDocument must agree');
      }
      if (record.reference.kind === 'DOCUMENTARY_EVIDENCE' && record.parent) {
        const parentRecord = records[executionReferenceKey(record.parent)];
        if (executionReferenceKey(parentRecord.sourceDocument) !==
            executionReferenceKey(record.sourceDocument)) {
          throw new ExecutionViewContractError('item parent and sourceDocument must agree');
        }
      }
    });
    const relationState = Object.create(null);
    function visitParent(reference) {
      const key = executionReferenceKey(reference);
      if (relationState[key] === 1) {
        throw new ExecutionViewContractError('cyclic parent relation in projection');
      }
      if (relationState[key] === 2) return;
      relationState[key] = 1;
      const parent = records[key].parent;
      if (parent) visitParent(parent);
      relationState[key] = 2;
    }
    orderedReferences.forEach(reference => visitParent(reference));
    const documentaryAssociations = [];
    const associationIds = Object.create(null);
    const associationSignatures = Object.create(null);
    for (let index = 0; index < associationEntries.length; index += 1) {
      const associationDescriptor = Object.getOwnPropertyDescriptor(
        associationEntries, String(index)
      );
      if (!associationDescriptor ||
          !Object.prototype.hasOwnProperty.call(associationDescriptor, 'value')) {
        throw new ExecutionViewContractError('associationEntries must contain data entries');
      }
      const association = associationDescriptor.value;
      if (!isPlainExecutionObject(association)) {
        throw new ExecutionViewContractError('association entry must be an object');
      }
      const keys = Object.keys(association).sort();
      const requiredAssociationKeys = [
        'associationId', 'left', 'right', 'sourceDocument', 'statementText'
      ];
      const allowedAssociationKeys = requiredAssociationKeys.concat(['provenance']);
      if (Object.getOwnPropertySymbols(association).length ||
          Object.getOwnPropertyNames(association).length !== keys.length ||
          keys.some(key => !Object.prototype.hasOwnProperty.call(
            Object.getOwnPropertyDescriptor(association, key), 'value'
          )) || requiredAssociationKeys.some(key => !keys.includes(key)) ||
          keys.some(key => !allowedAssociationKeys.includes(key))) {
        throw new ExecutionViewContractError('association entry has missing or unsupported fields');
      }
      if (requiredAssociationKeys.filter(key => key !== 'left' && key !== 'right' &&
          key !== 'sourceDocument').some(key =>
        typeof association[key] !== 'string' || !association[key])) {
        throw new ExecutionViewContractError('association text fields must be non-empty strings');
      }
      if (!(association.left instanceof TypedReference) ||
          !(association.right instanceof TypedReference) ||
          !(association.sourceDocument instanceof TypedReference) ||
          association.sourceDocument.kind !== 'DOCUMENT') {
        throw new ExecutionViewContractError('association references are invalid');
      }
      const leftKey = executionReferenceKey(association.left);
      const rightKey = executionReferenceKey(association.right);
      const sourceKey = executionReferenceKey(association.sourceDocument);
      if (leftKey === rightKey) {
        throw new ExecutionViewContractError('association endpoints must be distinct');
      }
      [leftKey, rightKey, sourceKey].forEach(referenceKey => {
        if (!Object.prototype.hasOwnProperty.call(records, referenceKey)) {
          throw new ExecutionViewContractError('association reference is missing from the view');
        }
      });
      if (records[sourceKey].reference.kind !== 'DOCUMENT') {
        throw new ExecutionViewContractError('association source must reference a DOCUMENT');
      }
      if (Object.prototype.hasOwnProperty.call(associationIds, association.associationId)) {
        throw new ExecutionViewContractError('duplicate association id');
      }
      associationIds[association.associationId] = true;
      if (Object.prototype.hasOwnProperty.call(association, 'provenance') &&
          association.provenance !== null && !isPlainExecutionObject(association.provenance)) {
        throw new ExecutionViewContractError('association provenance must be an object or null');
      }
      const hasProvenance = Object.prototype.hasOwnProperty.call(association, 'provenance');
      const copiedProvenance = hasProvenance
        ? immutableExecutionCopy(association.provenance) : undefined;
      const endpoints = [leftKey, rightKey].sort();
      const signature = executionCanonicalJson({
        endpoints,
        sourceDocument: sourceKey,
        statementText: association.statementText,
        hasProvenance,
        provenance: hasProvenance ? copiedProvenance : null
      });
      if (Object.prototype.hasOwnProperty.call(associationSignatures, signature)) {
        throw new ExecutionViewContractError('duplicate documentary association');
      }
      associationSignatures[signature] = true;
      const projected = {
        associationId: association.associationId,
        left: association.left,
        right: association.right,
        sourceDocument: association.sourceDocument,
        statementText: association.statementText
      };
      if (hasProvenance) {
        projected.provenance = copiedProvenance;
      }
      documentaryAssociations.push(Object.freeze(projected));
    }
    EXECUTION_VIEW_RECORDS.set(this, Object.freeze({
      byReference: Object.freeze(records),
      orderedReferences: Object.freeze(orderedReferences),
      documentaryAssociations: Object.freeze(documentaryAssociations),
      schemaVersion
    }));
    Object.freeze(this);
  }

  contains(reference) {
    const state = EXECUTION_VIEW_RECORDS.get(this);
    if (!state) throw new ExecutionViewContractError('invalid execution view receiver');
    const key = executionReferenceKey(reference);
    return Object.prototype.hasOwnProperty.call(state.byReference, key);
  }

  schemaVersion() {
    const state = EXECUTION_VIEW_RECORDS.get(this);
    if (!state) throw new ExecutionViewContractError('invalid execution view receiver');
    return state.schemaVersion;
  }

  documentaryAssociations(reference) {
    executionViewRecord(this, reference);
    const state = EXECUTION_VIEW_RECORDS.get(this);
    if (!state) throw new ExecutionViewContractError('invalid execution view receiver');
    const key = executionReferenceKey(reference);
    return Object.freeze(state.documentaryAssociations.filter(association =>
      executionReferenceKey(association.left) === key ||
      executionReferenceKey(association.right) === key
    ));
  }

  read(reference) {
    return immutableExecutionCopy(executionViewRecord(this, reference).value);
  }

  entityId(reference) {
    return executionViewRecord(this, reference).entityId;
  }

  parent(reference) {
    return executionViewRecord(this, reference).parent;
  }

  sourceDocument(reference) {
    return executionViewRecord(this, reference).sourceDocument;
  }

  referencesByEntity(entityId) {
    if (typeof entityId !== 'string' || !entityId) {
      throw new ExecutionViewContractError('entityId must be a non-empty string');
    }
    const state = EXECUTION_VIEW_RECORDS.get(this);
    if (!state) throw new ExecutionViewContractError('invalid execution view receiver');
    return Object.freeze(state.orderedReferences.filter(
      reference => state.byReference[executionReferenceKey(reference)].entityId === entityId
    ));
  }

  children(parentReference, entityId) {
    executionViewRecord(this, parentReference);
    if (entityId !== undefined && (typeof entityId !== 'string' || !entityId)) {
      throw new ExecutionViewContractError('entityId must be a non-empty string when provided');
    }
    const state = EXECUTION_VIEW_RECORDS.get(this);
    if (!state) throw new ExecutionViewContractError('invalid execution view receiver');
    const parentKey = executionReferenceKey(parentReference);
    return Object.freeze(state.orderedReferences.filter(reference => {
      const record = state.byReference[executionReferenceKey(reference)];
      return record.parent && executionReferenceKey(record.parent) === parentKey &&
        (entityId === undefined || record.entityId === entityId);
    }));
  }

  provenance(reference) {
    const record = executionViewRecord(this, reference);
    return record.hasProvenance ? immutableExecutionCopy(record.provenance) : undefined;
  }
}

/** Returns true only for instances branded by the immutable view constructor. */
function isImmutableExecutionView(view) {
  return EXECUTION_VIEW_RECORDS.has(view);
}

function executionCanonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(executionCanonicalJson).join(',') + ']';
  return '{' + Object.keys(value).sort().map(key =>
    JSON.stringify(key) + ':' + executionCanonicalJson(value[key])
  ).join(',') + '}';
}

/** Create the closed documentary projection from a validated RDE 0.2.0/0.3.0. */
function projectRdeToExecutionView_(rde, entityCatalog) {
  if (!rde || typeof rde !== 'object' || Array.isArray(rde)) {
    throw new ExecutionViewContractError('projection requires a validated RDE 0.2.0/0.3.0');
  }
  const schemaDescriptor = Object.getOwnPropertyDescriptor(rde, 'schema_version');
  if (!schemaDescriptor || !Object.prototype.hasOwnProperty.call(schemaDescriptor, 'value') ||
      !['0.2.0', '0.3.0'].includes(schemaDescriptor.value)) {
    throw new ExecutionViewContractError('projection requires a validated RDE 0.2.0/0.3.0');
  }
  const schemaVersion = schemaDescriptor.value;
  if (schemaVersion === '0.2.0' &&
      Object.prototype.hasOwnProperty.call(rde, 'documentary_associations')) {
    throw new ExecutionViewContractError('RDE 0.2.0 cannot declare documentary associations');
  }
  const expectedKeys = [
    'schema_version', 'process_id', 'source', 'extraction', 'records', 'extraction_warnings'
  ];
  if (schemaVersion === '0.3.0') expectedKeys.push('documentary_associations');
  if (!hasExactKeys_(rde, expectedKeys) || !Array.isArray(rde.records)) {
    throw new ExecutionViewContractError('projection requires a validated RDE 0.2.0/0.3.0');
  }
  const documentaryAssociations = schemaVersion === '0.3.0'
    ? Object.getOwnPropertyDescriptor(rde, 'documentary_associations').value : [];
  if (!entityCatalog || typeof entityCatalog !== 'object') {
    throw new ExecutionViewContractError('entityCatalog is required for RDE projection');
  }
  validateRdeRecordEnvelope_(rde.records, entityCatalog);
  if (schemaVersion === '0.3.0') {
    validateRdeDocumentaryAssociations_(documentaryAssociations, rde.records, entityCatalog);
  }
  const referencesByRecordId = Object.create(null);
  for (let index = 0; index < rde.records.length; index += 1) {
    const recordDescriptor = Object.getOwnPropertyDescriptor(rde.records, String(index));
    if (!recordDescriptor || !Object.prototype.hasOwnProperty.call(recordDescriptor, 'value')) {
      throw new ExecutionViewContractError('RDE record entry is invalid');
    }
    const record = recordDescriptor.value;
    if (!Object.prototype.hasOwnProperty.call(entityCatalog, record.entity_id) ||
        !entityCatalog[record.entity_id] || typeof entityCatalog[record.entity_id].TYPE !== 'string') {
      throw new ExecutionViewContractError('canonical entity TYPE is missing: ' + record.entity_id);
    }
    if (Object.prototype.hasOwnProperty.call(referencesByRecordId, record.record_id)) {
      throw new ExecutionViewContractError('duplicate record_id: ' + record.record_id);
    }
    referencesByRecordId[record.record_id] = new TypedReference(
      entityCatalog[record.entity_id].TYPE,
      record.record_id
    );
  }
  const entries = [];
  for (let index = 0; index < rde.records.length; index += 1) {
    const recordDescriptor = Object.getOwnPropertyDescriptor(rde.records, String(index));
    if (!recordDescriptor || !Object.prototype.hasOwnProperty.call(recordDescriptor, 'value')) {
      throw new ExecutionViewContractError('RDE record entry is invalid');
    }
    const record = recordDescriptor.value;
    const reference = referencesByRecordId[record.record_id];
    const parent = record.parent_record_id === null
      ? null : referencesByRecordId[record.parent_record_id];
    const sourceDocument = referencesByRecordId[record.source_document];
    if (!sourceDocument) {
      throw new ExecutionViewContractError('source_document reference is missing: ' + record.source_document);
    }
    if (record.parent_record_id !== null && !parent) {
      throw new ExecutionViewContractError('parent reference is missing: ' + record.parent_record_id);
    }
    const entry = {
      reference,
      entityId: record.entity_id,
      parent,
      sourceDocument,
      value: record.attributes
    };
    if (Object.prototype.hasOwnProperty.call(record, 'provenance')) {
      entry.provenance = record.provenance;
    }
    entries.push(entry);
  }
  const associations = [];
  if (schemaVersion === '0.3.0') {
    for (let index = 0; index < documentaryAssociations.length; index += 1) {
      const associationDescriptor = Object.getOwnPropertyDescriptor(
        documentaryAssociations, String(index)
      );
      if (!associationDescriptor ||
          !Object.prototype.hasOwnProperty.call(associationDescriptor, 'value')) {
        throw new ExecutionViewContractError('documentary association entry is invalid');
      }
      const association = associationDescriptor.value;
      associations.push({
        associationId: association.association_id,
        left: referencesByRecordId[association.left_record_id],
        right: referencesByRecordId[association.right_record_id],
        sourceDocument: referencesByRecordId[association.source_document],
        statementText: association.statement_text,
        ...(Object.prototype.hasOwnProperty.call(association, 'provenance')
          ? { provenance: association.provenance } : {})
      });
    }
  }
  return new ImmutableExecutionView(entries, associations, schemaVersion);
}
