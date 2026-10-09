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

function copyImmutableExecutionReference(reference, expectedKind) {
  if (!(reference instanceof TypedReference) ||
      Object.getPrototypeOf(reference) !== TypedReference.prototype ||
      !Object.isFrozen(reference) || Object.getOwnPropertySymbols(reference).length ||
      Object.getOwnPropertyNames(reference).length !== 2) {
    throw new ExecutionViewContractError('documentary date reference must be an immutable TypedReference');
  }
  const kindDescriptor = Object.getOwnPropertyDescriptor(reference, 'kind');
  const identifierDescriptor = Object.getOwnPropertyDescriptor(reference, 'identifier');
  if (!kindDescriptor || !Object.prototype.hasOwnProperty.call(kindDescriptor, 'value') ||
      !identifierDescriptor || !Object.prototype.hasOwnProperty.call(identifierDescriptor, 'value') ||
      typeof kindDescriptor.value !== 'string' || !kindDescriptor.value.trim() ||
      typeof identifierDescriptor.value !== 'string' || !identifierDescriptor.value.trim() ||
      kindDescriptor.value !== expectedKind) {
    throw new ExecutionViewContractError('documentary date reference fields are invalid');
  }
  return new TypedReference(kindDescriptor.value, identifierDescriptor.value);
}

function hasNativeExecutionNonJsonBrand(value) {
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

function isPlainExecutionObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (hasNativeExecutionNonJsonBrand(value)) return false;
  let current = value;
  while (current !== null) {
    if (Object.getOwnPropertyDescriptor(current, Symbol.toStringTag)) return false;
    current = Object.getPrototypeOf(current);
  }
  if (Object.prototype.toString.call(value) !== '[object Object]') return false;
  const prototype = Object.getPrototypeOf(value);
  // Execution facts originate in JSON and use an Object prototype. Reject
  // null-prototype containers, which can hide native Map/Set internal data.
  return prototype !== null && Object.getPrototypeOf(prototype) === null;
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

function assertStrictExecutionJsonValue(value, active = []) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value))) return;
  if (!value || typeof value !== 'object' || active.includes(value)) {
    throw new ExecutionViewContractError('declaration provenance must be strict JSON data');
  }
  active.push(value);
  if (Array.isArray(value)) {
    const keys = Object.keys(value);
    if (Object.getOwnPropertySymbols(value).length || keys.length !== value.length ||
        Object.getOwnPropertyNames(value).length !== value.length + 1) {
      throw new ExecutionViewContractError('declaration provenance arrays must be dense JSON arrays');
    }
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw new ExecutionViewContractError('declaration provenance cannot contain accessors');
      }
      assertStrictExecutionJsonValue(descriptor.value, active);
    }
  } else {
    if (!isPlainExecutionObject(value) || Object.getOwnPropertySymbols(value).length ||
        Object.getOwnPropertyNames(value).length !== Object.keys(value).length) {
      throw new ExecutionViewContractError('declaration provenance must contain plain JSON objects');
    }
    Object.keys(value).forEach(key => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw new ExecutionViewContractError('declaration provenance cannot contain accessors');
      }
      assertStrictExecutionJsonValue(descriptor.value, active);
    });
  }
  active.pop();
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
 * Read-only Process Memory over canonical records projected from RDE 0.2.0 through 0.5.0.
 * Only attributes are exposed by read(); structural relations use dedicated APIs.
 */
class ImmutableExecutionView {
  constructor(projectionEntries, associationEntries = [], schemaVersion = '0.2.0',
    declarationEntries = [], documentaryDateEntries = []) {
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
    if (!Array.isArray(declarationEntries) ||
        Object.getOwnPropertySymbols(declarationEntries).length ||
        Object.keys(declarationEntries).length !== declarationEntries.length ||
        Object.getOwnPropertyNames(declarationEntries).length !== declarationEntries.length + 1) {
      throw new ExecutionViewContractError('declarationEntries must be a dense array');
    }
    for (let index = 0; index < declarationEntries.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(declarationEntries, String(index));
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw new ExecutionViewContractError('declarationEntries must contain data entries');
      }
    }
    if (!Array.isArray(documentaryDateEntries) ||
        Object.getOwnPropertySymbols(documentaryDateEntries).length ||
        Object.keys(documentaryDateEntries).length !== documentaryDateEntries.length ||
        Object.getOwnPropertyNames(documentaryDateEntries).length !== documentaryDateEntries.length + 1) {
      throw new ExecutionViewContractError('documentaryDateEntries must be a dense array');
    }
    for (let index = 0; index < documentaryDateEntries.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(documentaryDateEntries, String(index));
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw new ExecutionViewContractError('documentaryDateEntries must contain data entries');
      }
    }
    if (!['0.2.0', '0.3.0', '0.4.0', '0.5.0'].includes(schemaVersion)) {
      throw new ExecutionViewContractError('unsupported execution view schemaVersion');
    }
    if (schemaVersion === '0.2.0' && associationEntries.length) {
      throw new ExecutionViewContractError('RDE 0.2.0 cannot contain documentary associations');
    }
    if (schemaVersion !== '0.4.0' && schemaVersion !== '0.5.0' && declarationEntries.length) {
      throw new ExecutionViewContractError('RDE 0.2.0/0.3.0 cannot contain DRT declaration items');
    }
    if (schemaVersion !== '0.5.0' && documentaryDateEntries.length) {
      throw new ExecutionViewContractError('only RDE 0.5.0 can contain documentary date items');
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
    const drtDeclarationItems = [];
    const declarationIds = Object.create(null);
    const declarationSignatures = Object.create(null);
    for (let index = 0; index < declarationEntries.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(declarationEntries, String(index));
      const declaration = descriptor.value;
      if (!isPlainExecutionObject(declaration)) {
        throw new ExecutionViewContractError('declaration entry must be an object');
      }
      const keys = Object.keys(declaration).sort();
      const requiredDeclarationKeys = [
        'declarationId', 'drt', 'activityServiceText', 'smsciScopeText',
        'sourceDocument', 'sourceText'
      ];
      const allowedDeclarationKeys = requiredDeclarationKeys.concat(['provenance']);
      if (Object.getOwnPropertySymbols(declaration).length ||
          Object.getOwnPropertyNames(declaration).length !== keys.length ||
          keys.some(key => !Object.prototype.hasOwnProperty.call(
            Object.getOwnPropertyDescriptor(declaration, key), 'value'
          )) || requiredDeclarationKeys.some(key => !keys.includes(key)) ||
          keys.some(key => !allowedDeclarationKeys.includes(key))) {
        throw new ExecutionViewContractError('declaration entry has missing or unsupported fields');
      }
      if (requiredDeclarationKeys.filter(key => key !== 'drt' && key !== 'sourceDocument')
        .some(key => typeof declaration[key] !== 'string' || !declaration[key].trim())) {
        throw new ExecutionViewContractError('declaration text fields must be non-empty strings');
      }
      if (!declaration.sourceText.includes(declaration.activityServiceText) ||
          !declaration.sourceText.includes(declaration.smsciScopeText)) {
        throw new ExecutionViewContractError('declaration literals must occur in sourceText');
      }
      if (!(declaration.drt instanceof TypedReference) || declaration.drt.kind !== 'DRT' ||
          !(declaration.sourceDocument instanceof TypedReference) ||
          declaration.sourceDocument.kind !== 'DOCUMENT') {
        throw new ExecutionViewContractError('declaration references are invalid');
      }
      const drtKey = executionReferenceKey(declaration.drt);
      const sourceKey = executionReferenceKey(declaration.sourceDocument);
      if (!Object.prototype.hasOwnProperty.call(records, drtKey) ||
          !Object.prototype.hasOwnProperty.call(records, sourceKey)) {
        throw new ExecutionViewContractError('declaration reference is missing from the view');
      }
      if (executionReferenceKey(records[drtKey].sourceDocument) !== sourceKey) {
        throw new ExecutionViewContractError('declaration source must match the DRT source');
      }
      if (Object.prototype.hasOwnProperty.call(declarationIds, declaration.declarationId)) {
        throw new ExecutionViewContractError('duplicate DRT declaration id');
      }
      declarationIds[declaration.declarationId] = true;
      if (Object.prototype.hasOwnProperty.call(declaration, 'provenance') &&
          declaration.provenance !== null && !isPlainExecutionObject(declaration.provenance)) {
        throw new ExecutionViewContractError('declaration provenance must be an object or null');
      }
      const hasProvenance = Object.prototype.hasOwnProperty.call(declaration, 'provenance');
      if (hasProvenance) assertStrictExecutionJsonValue(declaration.provenance);
      const copiedProvenance = hasProvenance
        ? immutableExecutionCopy(declaration.provenance) : undefined;
      const signature = executionCanonicalJson({
        drt: drtKey,
        activityServiceText: declaration.activityServiceText,
        smsciScopeText: declaration.smsciScopeText,
        sourceDocument: sourceKey,
        sourceText: declaration.sourceText,
        hasProvenance,
        provenance: hasProvenance ? copiedProvenance : null
      });
      if (Object.prototype.hasOwnProperty.call(declarationSignatures, signature)) {
        throw new ExecutionViewContractError('duplicate DRT declaration item');
      }
      declarationSignatures[signature] = true;
      const projected = {
        declarationId: declaration.declarationId,
        drt: declaration.drt,
        activityServiceText: declaration.activityServiceText,
        smsciScopeText: declaration.smsciScopeText,
        sourceDocument: declaration.sourceDocument,
        sourceText: declaration.sourceText
      };
      if (hasProvenance) projected.provenance = copiedProvenance;
      drtDeclarationItems.push(Object.freeze(projected));
    }
    const documentaryDateItems = [];
    const dateItemIds = Object.create(null);
    for (let index = 0; index < documentaryDateEntries.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(documentaryDateEntries, String(index));
      const dateItem = descriptor.value;
      if (!isPlainExecutionObject(dateItem)) {
        throw new ExecutionViewContractError('documentary date entry must be an object');
      }
      const keys = Object.keys(dateItem).sort();
      const requiredDateKeys = [
        'dateItemId', 'product', 'dateLabelText', 'dateText', 'sourceDocument', 'sourceText'
      ];
      const allowedDateKeys = requiredDateKeys.concat(['provenance']);
      if (Object.getOwnPropertySymbols(dateItem).length ||
          Object.getOwnPropertyNames(dateItem).length !== keys.length ||
          keys.some(key => !Object.prototype.hasOwnProperty.call(
            Object.getOwnPropertyDescriptor(dateItem, key), 'value'
          )) || requiredDateKeys.some(key => !keys.includes(key)) ||
          keys.some(key => !allowedDateKeys.includes(key))) {
        throw new ExecutionViewContractError('documentary date entry has missing or unsupported fields');
      }
      if (requiredDateKeys.filter(key => key !== 'product' && key !== 'sourceDocument')
        .some(key => typeof dateItem[key] !== 'string' || !dateItem[key].trim())) {
        throw new ExecutionViewContractError('documentary date text fields must be non-empty strings');
      }
      if (!dateItem.sourceText.includes(dateItem.dateLabelText) ||
          !dateItem.sourceText.includes(dateItem.dateText)) {
        throw new ExecutionViewContractError('documentary date literals must occur in sourceText');
      }
      const productReference = copyImmutableExecutionReference(dateItem.product, 'TEST_REPORT');
      const sourceReference = copyImmutableExecutionReference(dateItem.sourceDocument, 'DOCUMENT');
      const productKey = executionReferenceKey(productReference);
      const sourceKey = executionReferenceKey(sourceReference);
      if (!Object.prototype.hasOwnProperty.call(records, productKey) ||
          !Object.prototype.hasOwnProperty.call(records, sourceKey)) {
        throw new ExecutionViewContractError('documentary date reference is missing from the view');
      }
      const productRecordReference = copyImmutableExecutionReference(
        records[productKey].reference, 'TEST_REPORT'
      );
      const productSourceReference = copyImmutableExecutionReference(
        records[productKey].sourceDocument, 'DOCUMENT'
      );
      const sourceRecordReference = copyImmutableExecutionReference(
        records[sourceKey].reference, 'DOCUMENT'
      );
      if (executionReferenceKey(productRecordReference) !== productKey ||
          executionReferenceKey(sourceRecordReference) !== sourceKey ||
          executionReferenceKey(productSourceReference) !== sourceKey) {
        throw new ExecutionViewContractError('documentary date source must match the product source');
      }
      if (Object.prototype.hasOwnProperty.call(dateItemIds, dateItem.dateItemId)) {
        throw new ExecutionViewContractError('duplicate documentary date item id');
      }
      dateItemIds[dateItem.dateItemId] = true;
      const hasProvenance = Object.prototype.hasOwnProperty.call(dateItem, 'provenance');
      if (hasProvenance && dateItem.provenance !== null &&
          !isPlainExecutionObject(dateItem.provenance)) {
        throw new ExecutionViewContractError('documentary date provenance must be an object or null');
      }
      if (hasProvenance) assertStrictExecutionJsonValue(dateItem.provenance);
      const copiedProvenance = hasProvenance
        ? immutableExecutionCopy(dateItem.provenance) : undefined;
      const projected = {
        dateItemId: dateItem.dateItemId,
        product: productReference,
        dateLabelText: dateItem.dateLabelText,
        dateText: dateItem.dateText,
        sourceDocument: sourceReference,
        sourceText: dateItem.sourceText
      };
      if (hasProvenance) projected.provenance = copiedProvenance;
      documentaryDateItems.push(Object.freeze(projected));
    }
    EXECUTION_VIEW_RECORDS.set(this, Object.freeze({
      byReference: Object.freeze(records),
      orderedReferences: Object.freeze(orderedReferences),
      documentaryAssociations: Object.freeze(documentaryAssociations),
      drtDeclarationItems: Object.freeze(drtDeclarationItems),
      documentaryDateItems: Object.freeze(documentaryDateItems),
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

  drtDeclarationItems(reference) {
    const record = executionViewRecord(this, reference);
    if (record.reference.kind !== 'DRT') {
      throw new ExecutionViewContractError('drtDeclarationItems requires a DRT reference');
    }
    const state = EXECUTION_VIEW_RECORDS.get(this);
    if (!state) throw new ExecutionViewContractError('invalid execution view receiver');
    const key = executionReferenceKey(reference);
    return Object.freeze(state.drtDeclarationItems.filter(item =>
      executionReferenceKey(item.drt) === key
    ));
  }

  documentaryDateItems(reference) {
    const record = executionViewRecord(this, reference);
    if (record.reference.kind !== 'TEST_REPORT') {
      throw new ExecutionViewContractError('documentaryDateItems requires a TEST_REPORT reference');
    }
    const state = EXECUTION_VIEW_RECORDS.get(this);
    if (!state) throw new ExecutionViewContractError('invalid execution view receiver');
    const key = executionReferenceKey(reference);
    return Object.freeze(state.documentaryDateItems.filter(item =>
      executionReferenceKey(item.product) === key
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

function snapshotImmutableExecutionViewEntityRecords_(view, entityId) {
  if (typeof entityId !== 'string' || !entityId) {
    throw new ExecutionViewContractError('entityId must be a non-empty string');
  }
  const state = EXECUTION_VIEW_RECORDS.get(view);
  if (!state) {
    throw new ExecutionViewContractError('invalid execution view receiver');
  }
  const result = [];
  for (let index = 0; index < state.orderedReferences.length; index += 1) {
    const reference = state.orderedReferences[index];
    const record = state.byReference[executionReferenceKey(reference)];
    if (record.entityId !== entityId) continue;
    const item = {
      reference: Object.freeze({
        kind: record.reference.kind,
        identifier: record.reference.identifier
      }),
      entityId: record.entityId,
      sourceDocument: Object.freeze({
        kind: record.sourceDocument.kind,
        identifier: record.sourceDocument.identifier
      }),
      value: immutableExecutionCopy(record.value)
    };
    if (record.hasProvenance) {
      item.provenance = immutableExecutionCopy(record.provenance);
    }
    Object.freeze(item);
    result[result.length] = item;
  }
  return Object.freeze(result);
}

(function (global) {
  const intrinsicSnapshot = snapshotImmutableExecutionViewEntityRecords_;
  Object.freeze(ImmutableExecutionView.prototype);
  Object.defineProperty(global, 'snapshotImmutableExecutionViewEntityRecords', {
    value: intrinsicSnapshot,
    enumerable: false,
    writable: false,
    configurable: false
  });
})(globalThis);

function executionCanonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(executionCanonicalJson).join(',') + ']';
  return '{' + Object.keys(value).sort().map(key =>
    JSON.stringify(key) + ':' + executionCanonicalJson(value[key])
  ).join(',') + '}';
}

/** Create the closed documentary projection from a validated RDE 0.2.0 through 0.5.0. */
function projectRdeToExecutionView_(rde, entityCatalog) {
  if (!rde || typeof rde !== 'object' || Array.isArray(rde)) {
    throw new ExecutionViewContractError('projection requires a validated RDE 0.2.0 through 0.5.0');
  }
  const schemaDescriptor = Object.getOwnPropertyDescriptor(rde, 'schema_version');
  if (!schemaDescriptor || !Object.prototype.hasOwnProperty.call(schemaDescriptor, 'value') ||
      !['0.2.0', '0.3.0', '0.4.0', '0.5.0'].includes(schemaDescriptor.value)) {
    throw new ExecutionViewContractError('projection requires a validated RDE 0.2.0 through 0.5.0');
  }
  const schemaVersion = schemaDescriptor.value;
  if (schemaVersion === '0.2.0' &&
      (Object.prototype.hasOwnProperty.call(rde, 'documentary_associations') ||
       Object.prototype.hasOwnProperty.call(rde, 'drt_declaration_items') ||
       Object.prototype.hasOwnProperty.call(rde, 'documentary_date_items'))) {
    throw new ExecutionViewContractError('RDE 0.2.0 cannot declare documentary associations');
  }
  const expectedKeys = [
    'schema_version', 'process_id', 'source', 'extraction', 'records', 'extraction_warnings'
  ];
  if (schemaVersion === '0.3.0' || schemaVersion === '0.4.0' || schemaVersion === '0.5.0') {
    expectedKeys.push('documentary_associations');
  }
  if (schemaVersion === '0.4.0' || schemaVersion === '0.5.0') expectedKeys.push('drt_declaration_items');
  if (schemaVersion === '0.5.0') expectedKeys.push('documentary_date_items');
  if (!hasExactKeys_(rde, expectedKeys) || !Array.isArray(rde.records)) {
    throw new ExecutionViewContractError('projection requires a validated RDE 0.2.0 through 0.5.0');
  }
  const documentaryAssociations = schemaVersion === '0.3.0' || schemaVersion === '0.4.0' ||
    schemaVersion === '0.5.0'
    ? Object.getOwnPropertyDescriptor(rde, 'documentary_associations').value : [];
  const drtDeclarationItems = schemaVersion === '0.4.0' || schemaVersion === '0.5.0'
    ? Object.getOwnPropertyDescriptor(rde, 'drt_declaration_items').value : [];
  const documentaryDateItems = schemaVersion === '0.5.0'
    ? Object.getOwnPropertyDescriptor(rde, 'documentary_date_items').value : [];
  if (!entityCatalog || typeof entityCatalog !== 'object') {
    throw new ExecutionViewContractError('entityCatalog is required for RDE projection');
  }
  validateRdeRecordEnvelope_(rde.records, entityCatalog);
  if (schemaVersion === '0.3.0' || schemaVersion === '0.4.0' || schemaVersion === '0.5.0') {
    validateRdeDocumentaryAssociations_(documentaryAssociations, rde.records, entityCatalog);
  }
  if (schemaVersion === '0.4.0' || schemaVersion === '0.5.0') {
    validateRdeDrtDeclarationItems_(drtDeclarationItems, rde.records, entityCatalog);
  }
  if (schemaVersion === '0.5.0') {
    validateRdeDocumentaryDateItems_(documentaryDateItems, rde.records, entityCatalog);
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
  if (schemaVersion === '0.3.0' || schemaVersion === '0.4.0' || schemaVersion === '0.5.0') {
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
  const declarations = [];
  if (schemaVersion === '0.4.0' || schemaVersion === '0.5.0') {
    for (let index = 0; index < drtDeclarationItems.length; index += 1) {
      const declarationDescriptor = Object.getOwnPropertyDescriptor(drtDeclarationItems, String(index));
      if (!declarationDescriptor ||
          !Object.prototype.hasOwnProperty.call(declarationDescriptor, 'value')) {
        throw new ExecutionViewContractError('DRT declaration item is invalid');
      }
      const declaration = declarationDescriptor.value;
      declarations.push({
        declarationId: declaration.declaration_id,
        drt: referencesByRecordId[declaration.drt_record_id],
        activityServiceText: declaration.activity_service_text,
        smsciScopeText: declaration.smsci_scope_text,
        sourceDocument: referencesByRecordId[declaration.source_document],
        sourceText: declaration.source_text,
        ...(Object.prototype.hasOwnProperty.call(declaration, 'provenance')
          ? { provenance: declaration.provenance } : {})
      });
    }
  }
  const dates = [];
  if (schemaVersion === '0.5.0') {
    for (let index = 0; index < documentaryDateItems.length; index += 1) {
      const dateDescriptor = Object.getOwnPropertyDescriptor(documentaryDateItems, String(index));
      if (!dateDescriptor || !Object.prototype.hasOwnProperty.call(dateDescriptor, 'value')) {
        throw new ExecutionViewContractError('documentary date item is invalid');
      }
      const dateItem = dateDescriptor.value;
      dates.push({
        dateItemId: dateItem.date_item_id,
        product: referencesByRecordId[dateItem.product_record_id],
        dateLabelText: dateItem.date_label_text,
        dateText: dateItem.date_text,
        sourceDocument: referencesByRecordId[dateItem.source_document],
        sourceText: dateItem.source_text,
        ...(Object.prototype.hasOwnProperty.call(dateItem, 'provenance')
          ? { provenance: dateItem.provenance } : {})
      });
    }
  }
  return new ImmutableExecutionView(entries, associations, schemaVersion, declarations, dates);
}
