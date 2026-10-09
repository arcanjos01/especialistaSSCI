/* Immutable view over entries produced by an authorized projection. */

class ExecutionViewContractError extends Error {}
class ExecutionViewLookupError extends ExecutionViewContractError {}

const {
  ImmutableExecutionView,
  isImmutableExecutionView,
  snapshotImmutableExecutionViewEntityRecords_
} = (function () {
  'use strict';

  const executionViewRecords_ = new WeakMap();
  const executionViewTypedReference_ = TypedReference;
  const executionViewContractError_ = ExecutionViewContractError;
  const executionViewLookupError_ = ExecutionViewLookupError;
  const executionViewReflectApply_ = Reflect.apply;
  const executionViewWeakMapGet_ = WeakMap.prototype.get;
  const executionViewWeakMapSet_ = WeakMap.prototype.set;
  const executionViewWeakMapHas_ = WeakMap.prototype.has;
  const executionViewFreeze_ = Object.freeze;
  const executionViewIsFrozen_ = Object.isFrozen;
  const executionViewStringify_ = JSON.stringify;
  const executionViewArrayIsArray_ = Array.isArray;
  const executionViewNumberIsFinite_ = Number.isFinite;
  const executionViewGetPrototypeOf_ = Object.getPrototypeOf;
  const executionViewGetOwnPropertyDescriptor_ = Object.getOwnPropertyDescriptor;
  const executionViewGetOwnPropertyNames_ = Object.getOwnPropertyNames;
  const executionViewGetOwnPropertySymbols_ = Object.getOwnPropertySymbols;
  const executionViewKeys_ = Object.keys;
  const executionViewCreate_ = Object.create;
  const executionViewDefineProperty_ = Object.defineProperty;
  const executionViewHasOwnProperty_ = Object.prototype.hasOwnProperty;
  const executionViewObjectToString_ = Object.prototype.toString;
  const executionViewSymbolToStringTag_ = Symbol.toStringTag;
  const executionViewMapHas_ = typeof Map === 'function' ? Map.prototype.has : null;
  const executionViewSetHas_ = typeof Set === 'function' ? Set.prototype.has : null;
  const executionViewWeakSetHas_ = typeof WeakSet === 'function' ? WeakSet.prototype.has : null;
  const executionViewArrayBufferIsView_ =
    typeof ArrayBuffer === 'function' ? ArrayBuffer.isView : null;
  const executionViewArrayBufferByteLength_ =
    typeof ArrayBuffer === 'function'
      ? Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get
      : null;
  const executionViewSharedArrayBufferByteLength_ =
    typeof SharedArrayBuffer === 'function'
      ? Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, 'byteLength').get
      : null;
  const executionViewDataViewByteLength_ =
    typeof DataView === 'function'
      ? Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get
      : null;

  function executionViewHasOwn_(object, key) {
    return executionViewReflectApply_(executionViewHasOwnProperty_, object, [key]);
  }

  function executionViewIdentityContains_(items, value) {
    for (let index = 0; index < items.length; index += 1) {
      if (items[index] === value) return true;
    }
    return false;
  }

  function executionViewAppend_(items, value) {
    const copy = [];
    for (let index = 0; index < items.length; index += 1) copy[index] = items[index];
    copy[copy.length] = value;
    return copy;
  }

  function executionReferenceKey(reference) {
    if (!(reference instanceof executionViewTypedReference_)) {
      throw new executionViewContractError_('reference must be a TypedReference');
    }
    return executionViewStringify_([reference.kind, reference.identifier]);
  }

  function copyImmutableExecutionReference(reference, expectedKind) {
    if (!(reference instanceof executionViewTypedReference_) ||
        executionViewGetPrototypeOf_(reference) !== executionViewTypedReference_.prototype ||
        !executionViewIsFrozen_(reference) ||
        executionViewGetOwnPropertySymbols_(reference).length ||
        executionViewGetOwnPropertyNames_(reference).length !== 2) {
      throw new executionViewContractError_(
        'documentary date reference must be an immutable TypedReference'
      );
    }
    const kindDescriptor = executionViewGetOwnPropertyDescriptor_(reference, 'kind');
    const identifierDescriptor = executionViewGetOwnPropertyDescriptor_(reference, 'identifier');
    if (!kindDescriptor || !executionViewHasOwn_(kindDescriptor, 'value') ||
        !identifierDescriptor || !executionViewHasOwn_(identifierDescriptor, 'value') ||
        typeof kindDescriptor.value !== 'string' || !kindDescriptor.value.trim() ||
        typeof identifierDescriptor.value !== 'string' || !identifierDescriptor.value.trim() ||
        kindDescriptor.value !== expectedKind) {
      throw new executionViewContractError_('documentary date reference fields are invalid');
    }
    return new executionViewTypedReference_(
      kindDescriptor.value, identifierDescriptor.value
    );
  }

  function hasNativeExecutionNonJsonBrand(value) {
    const probe = {};
    const brandChecks = [
      executionViewMapHas_,
      executionViewSetHas_,
      executionViewWeakMapHas_,
      executionViewWeakSetHas_
    ];
    for (let index = 0; index < brandChecks.length; index += 1) {
      const check = brandChecks[index];
      if (!check) continue;
      try {
        executionViewReflectApply_(check, value, [probe]);
        return true;
      } catch (error) {
        // Intrinsic brand checks reject ordinary objects without reading them.
      }
    }
    if (executionViewArrayBufferIsView_ &&
        executionViewReflectApply_(executionViewArrayBufferIsView_, ArrayBuffer, [value])) {
      return true;
    }
    const byteLengthGetters = [
      executionViewArrayBufferByteLength_,
      executionViewSharedArrayBufferByteLength_,
      executionViewDataViewByteLength_
    ];
    for (let index = 0; index < byteLengthGetters.length; index += 1) {
      const getter = byteLengthGetters[index];
      if (!getter) continue;
      try {
        executionViewReflectApply_(getter, value, []);
        return true;
      } catch (error) {
        // Intrinsic getters reject values without the corresponding internal slots.
      }
    }
    return false;
  }

  function isPlainExecutionObject(value) {
    if (!value || typeof value !== 'object' || executionViewArrayIsArray_(value)) return false;
    if (hasNativeExecutionNonJsonBrand(value)) return false;
    let current = value;
    while (current !== null) {
      if (executionViewGetOwnPropertyDescriptor_(current, executionViewSymbolToStringTag_)) {
        return false;
      }
      current = executionViewGetPrototypeOf_(current);
    }
    if (executionViewReflectApply_(executionViewObjectToString_, value, []) !== '[object Object]') {
      return false;
    }
    const prototype = executionViewGetPrototypeOf_(value);
    return prototype !== null && executionViewGetPrototypeOf_(prototype) === null;
  }

  function immutableExecutionCopy(value, active = []) {
    if (value instanceof executionViewTypedReference_) return value;
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && executionViewNumberIsFinite_(value)) return value;

    if (executionViewArrayIsArray_(value)) {
      if (executionViewIdentityContains_(active, value)) {
        throw new executionViewContractError_('cyclic projection values are not supported');
      }
      if (executionViewGetOwnPropertySymbols_(value).length ||
          executionViewKeys_(value).length !== value.length) {
        throw new executionViewContractError_(
          'projection arrays must contain only indexed values'
        );
      }
      const nextActive = executionViewAppend_(active, value);
      const copy = [];
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = executionViewGetOwnPropertyDescriptor_(value, String(index));
        if (!descriptor || !executionViewHasOwn_(descriptor, 'value')) {
          throw new executionViewContractError_(
            'projection arrays must contain data values'
          );
        }
        copy[index] = immutableExecutionCopy(descriptor.value, nextActive);
      }
      return executionViewFreeze_(copy);
    }

    if (isPlainExecutionObject(value)) {
      if (executionViewIdentityContains_(active, value)) {
        throw new executionViewContractError_('cyclic projection values are not supported');
      }
      if (executionViewGetOwnPropertySymbols_(value).length) {
        throw new executionViewContractError_(
          'projection objects cannot contain symbol keys'
        );
      }
      const nextActive = executionViewAppend_(active, value);
      const copy = {};
      const keys = executionViewKeys_(value);
      keys.sort();
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        const descriptor = executionViewGetOwnPropertyDescriptor_(value, key);
        if (!descriptor || !executionViewHasOwn_(descriptor, 'value')) {
          throw new executionViewContractError_(
            'projection objects must contain data values'
          );
        }
        executionViewDefineProperty_(copy, key, {
          value: immutableExecutionCopy(descriptor.value, nextActive),
          enumerable: true,
          writable: false,
          configurable: false
        });
      }
      return executionViewFreeze_(copy);
    }

    throw new executionViewContractError_(
      'projection values must be JSON-like values or TypedReference'
    );
  }

  function assertStrictExecutionJsonValue(value, active = []) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean' ||
        (typeof value === 'number' && executionViewNumberIsFinite_(value))) return;
    if (!value || typeof value !== 'object' ||
        executionViewIdentityContains_(active, value)) {
      throw new executionViewContractError_(
        'declaration provenance must be strict JSON data'
      );
    }
    const nextActive = executionViewAppend_(active, value);
    if (executionViewArrayIsArray_(value)) {
      const keys = executionViewKeys_(value);
      if (executionViewGetOwnPropertySymbols_(value).length ||
          keys.length !== value.length ||
          executionViewGetOwnPropertyNames_(value).length !== value.length + 1) {
        throw new executionViewContractError_(
          'declaration provenance arrays must be dense JSON arrays'
        );
      }
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = executionViewGetOwnPropertyDescriptor_(value, String(index));
        if (!descriptor || !executionViewHasOwn_(descriptor, 'value')) {
          throw new executionViewContractError_(
            'declaration provenance cannot contain accessors'
          );
        }
        assertStrictExecutionJsonValue(descriptor.value, nextActive);
      }
      return;
    }
    if (!isPlainExecutionObject(value) ||
        executionViewGetOwnPropertySymbols_(value).length ||
        executionViewGetOwnPropertyNames_(value).length !==
          executionViewKeys_(value).length) {
      throw new executionViewContractError_(
        'declaration provenance must contain plain JSON objects'
      );
    }
    const keys = executionViewKeys_(value);
    for (let index = 0; index < keys.length; index += 1) {
      const descriptor = executionViewGetOwnPropertyDescriptor_(value, keys[index]);
      if (!descriptor || !executionViewHasOwn_(descriptor, 'value')) {
        throw new executionViewContractError_(
          'declaration provenance cannot contain accessors'
        );
      }
      assertStrictExecutionJsonValue(descriptor.value, nextActive);
    }
  }

  function executionViewStateGet_(view) {
    return executionViewReflectApply_(executionViewWeakMapGet_, executionViewRecords_, [view]);
  }

  function executionViewStateSet_(view, state) {
    executionViewReflectApply_(executionViewWeakMapSet_, executionViewRecords_, [view, state]);
  }

  function executionViewStateHas_(view) {
    return executionViewReflectApply_(executionViewWeakMapHas_, executionViewRecords_, [view]);
  }

function executionViewRecord(view, reference) {
  const state = executionViewStateGet_(view);
  if (!state) throw new executionViewContractError_('invalid execution view receiver');
  const key = executionReferenceKey(reference);
  if (!Object.prototype.hasOwnProperty.call(state.byReference, key)) {
    throw new executionViewLookupError_('reference not found: ' + reference.kind + ':' + reference.identifier);
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
      throw new executionViewContractError_('projectionEntries must be an array');
    }
    if (Object.getOwnPropertySymbols(projectionEntries).length ||
        Object.keys(projectionEntries).length !== projectionEntries.length) {
      throw new executionViewContractError_('projectionEntries must be a dense array');
    }
    if (!Array.isArray(associationEntries) ||
        Object.getOwnPropertySymbols(associationEntries).length ||
        Object.keys(associationEntries).length !== associationEntries.length) {
      throw new executionViewContractError_('associationEntries must be a dense array');
    }
    for (let index = 0; index < associationEntries.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(associationEntries, String(index));
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw new executionViewContractError_('associationEntries must contain data entries');
      }
    }
    if (!Array.isArray(declarationEntries) ||
        Object.getOwnPropertySymbols(declarationEntries).length ||
        Object.keys(declarationEntries).length !== declarationEntries.length ||
        Object.getOwnPropertyNames(declarationEntries).length !== declarationEntries.length + 1) {
      throw new executionViewContractError_('declarationEntries must be a dense array');
    }
    for (let index = 0; index < declarationEntries.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(declarationEntries, String(index));
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw new executionViewContractError_('declarationEntries must contain data entries');
      }
    }
    if (!Array.isArray(documentaryDateEntries) ||
        Object.getOwnPropertySymbols(documentaryDateEntries).length ||
        Object.keys(documentaryDateEntries).length !== documentaryDateEntries.length ||
        Object.getOwnPropertyNames(documentaryDateEntries).length !== documentaryDateEntries.length + 1) {
      throw new executionViewContractError_('documentaryDateEntries must be a dense array');
    }
    for (let index = 0; index < documentaryDateEntries.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(documentaryDateEntries, String(index));
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw new executionViewContractError_('documentaryDateEntries must contain data entries');
      }
    }
    if (!['0.2.0', '0.3.0', '0.4.0', '0.5.0'].includes(schemaVersion)) {
      throw new executionViewContractError_('unsupported execution view schemaVersion');
    }
    if (schemaVersion === '0.2.0' && associationEntries.length) {
      throw new executionViewContractError_('RDE 0.2.0 cannot contain documentary associations');
    }
    if (schemaVersion !== '0.4.0' && schemaVersion !== '0.5.0' && declarationEntries.length) {
      throw new executionViewContractError_('RDE 0.2.0/0.3.0 cannot contain DRT declaration items');
    }
    if (schemaVersion !== '0.5.0' && documentaryDateEntries.length) {
      throw new executionViewContractError_('only RDE 0.5.0 can contain documentary date items');
    }
    const records = Object.create(null);
    const orderedReferences = [];
    const recordIds = Object.create(null);
    for (let index = 0; index < projectionEntries.length; index += 1) {
      const itemDescriptor = Object.getOwnPropertyDescriptor(projectionEntries, String(index));
      if (!itemDescriptor || !Object.prototype.hasOwnProperty.call(itemDescriptor, 'value')) {
        throw new executionViewContractError_('projectionEntries must contain data entries');
      }
      const entry = itemDescriptor.value;
      if (!isPlainExecutionObject(entry)) {
        throw new executionViewContractError_('projection entry must be an object');
      }
      const keys = Object.keys(entry).sort();
      if (Object.getOwnPropertySymbols(entry).length ||
          Object.getOwnPropertyNames(entry).length !== keys.length ||
          keys.some(key => !Object.prototype.hasOwnProperty.call(
            Object.getOwnPropertyDescriptor(entry, key), 'value'
          ))) {
        throw new executionViewContractError_('projection entries must contain only enumerable data fields');
      }
      const required = ['reference', 'entityId', 'parent', 'sourceDocument', 'value'];
      const allowed = required.concat(['provenance']);
      if (required.some(key => !keys.includes(key)) ||
          keys.some(key => !allowed.includes(key))) {
        throw new executionViewContractError_(
          'projection entry requires reference, entityId, parent, sourceDocument and value'
        );
      }
      const key = executionReferenceKey(entry.reference);
      if (Object.prototype.hasOwnProperty.call(records, key)) {
        throw new executionViewContractError_(
          'duplicate reference: ' + entry.reference.kind + ':' + entry.reference.identifier
        );
      }
      if (Object.prototype.hasOwnProperty.call(recordIds, entry.reference.identifier)) {
        throw new executionViewContractError_('duplicate record_id: ' + entry.reference.identifier);
      }
      if (typeof entry.entityId !== 'string' || !entry.entityId) {
        throw new executionViewContractError_('entityId must be a non-empty string');
      }
      if (entry.parent !== null && !(entry.parent instanceof executionViewTypedReference_)) {
        throw new executionViewContractError_('parent must be a TypedReference or null');
      }
      if (!(entry.sourceDocument instanceof executionViewTypedReference_) ||
          entry.sourceDocument.kind !== 'DOCUMENT') {
        throw new executionViewContractError_('sourceDocument must reference a DOCUMENT');
      }
      if (entry.reference.kind === 'DOCUMENT' &&
          (entry.parent !== null || executionReferenceKey(entry.sourceDocument) !== key)) {
        throw new executionViewContractError_('DOCUMENT must be root and self-source');
      }
      if (entry.reference.kind === 'DOCUMENT_SECTION' &&
          (!entry.parent || entry.parent.kind !== 'DOCUMENT')) {
        throw new executionViewContractError_('DOCUMENT_SECTION must have a DOCUMENT parent');
      }
      if (entry.reference.kind === 'DOCUMENTARY_EVIDENCE' && entry.parent !== null &&
          entry.parent.kind !== 'DOCUMENT_SECTION') {
        throw new executionViewContractError_(
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
        throw new executionViewContractError_('sourceDocument reference is missing from the view');
      }
      if (record.parent &&
          !Object.prototype.hasOwnProperty.call(records, executionReferenceKey(record.parent))) {
        throw new executionViewContractError_('parent reference is missing from the view');
      }
      if (record.reference.kind === 'DOCUMENT_SECTION' &&
          executionReferenceKey(record.parent) !== executionReferenceKey(record.sourceDocument)) {
        throw new executionViewContractError_('section parent and sourceDocument must agree');
      }
      if (record.reference.kind === 'DOCUMENTARY_EVIDENCE' && record.parent) {
        const parentRecord = records[executionReferenceKey(record.parent)];
        if (executionReferenceKey(parentRecord.sourceDocument) !==
            executionReferenceKey(record.sourceDocument)) {
          throw new executionViewContractError_('item parent and sourceDocument must agree');
        }
      }
    });
    const relationState = Object.create(null);
    function visitParent(reference) {
      const key = executionReferenceKey(reference);
      if (relationState[key] === 1) {
        throw new executionViewContractError_('cyclic parent relation in projection');
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
        throw new executionViewContractError_('associationEntries must contain data entries');
      }
      const association = associationDescriptor.value;
      if (!isPlainExecutionObject(association)) {
        throw new executionViewContractError_('association entry must be an object');
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
        throw new executionViewContractError_('association entry has missing or unsupported fields');
      }
      if (requiredAssociationKeys.filter(key => key !== 'left' && key !== 'right' &&
          key !== 'sourceDocument').some(key =>
        typeof association[key] !== 'string' || !association[key])) {
        throw new executionViewContractError_('association text fields must be non-empty strings');
      }
      if (!(association.left instanceof executionViewTypedReference_) ||
          !(association.right instanceof executionViewTypedReference_) ||
          !(association.sourceDocument instanceof executionViewTypedReference_) ||
          association.sourceDocument.kind !== 'DOCUMENT') {
        throw new executionViewContractError_('association references are invalid');
      }
      const leftKey = executionReferenceKey(association.left);
      const rightKey = executionReferenceKey(association.right);
      const sourceKey = executionReferenceKey(association.sourceDocument);
      if (leftKey === rightKey) {
        throw new executionViewContractError_('association endpoints must be distinct');
      }
      [leftKey, rightKey, sourceKey].forEach(referenceKey => {
        if (!Object.prototype.hasOwnProperty.call(records, referenceKey)) {
          throw new executionViewContractError_('association reference is missing from the view');
        }
      });
      if (records[sourceKey].reference.kind !== 'DOCUMENT') {
        throw new executionViewContractError_('association source must reference a DOCUMENT');
      }
      if (Object.prototype.hasOwnProperty.call(associationIds, association.associationId)) {
        throw new executionViewContractError_('duplicate association id');
      }
      associationIds[association.associationId] = true;
      if (Object.prototype.hasOwnProperty.call(association, 'provenance') &&
          association.provenance !== null && !isPlainExecutionObject(association.provenance)) {
        throw new executionViewContractError_('association provenance must be an object or null');
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
        throw new executionViewContractError_('duplicate documentary association');
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
        throw new executionViewContractError_('declaration entry must be an object');
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
        throw new executionViewContractError_('declaration entry has missing or unsupported fields');
      }
      if (requiredDeclarationKeys.filter(key => key !== 'drt' && key !== 'sourceDocument')
        .some(key => typeof declaration[key] !== 'string' || !declaration[key].trim())) {
        throw new executionViewContractError_('declaration text fields must be non-empty strings');
      }
      if (!declaration.sourceText.includes(declaration.activityServiceText) ||
          !declaration.sourceText.includes(declaration.smsciScopeText)) {
        throw new executionViewContractError_('declaration literals must occur in sourceText');
      }
      if (!(declaration.drt instanceof executionViewTypedReference_) || declaration.drt.kind !== 'DOCUMENT' ||
          !(declaration.sourceDocument instanceof executionViewTypedReference_) ||
          declaration.sourceDocument.kind !== 'DOCUMENT') {
        throw new executionViewContractError_('declaration references are invalid');
      }
      const drtKey = executionReferenceKey(declaration.drt);
      const sourceKey = executionReferenceKey(declaration.sourceDocument);
      if (!Object.prototype.hasOwnProperty.call(records, drtKey) ||
          !Object.prototype.hasOwnProperty.call(records, sourceKey)) {
        throw new executionViewContractError_('declaration reference is missing from the view');
      }
      const drtRecord = records[drtKey];
      if ((drtRecord.entityId !== 'ART' &&
           drtRecord.entityId !== 'RRT' &&
           drtRecord.entityId !== 'TRT') ||
          drtRecord.reference.kind !== 'DOCUMENT') {
        throw new executionViewContractError_(
          'declaration DRT must reference a concrete ART, RRT or TRT document'
        );
      }
      if (executionReferenceKey(drtRecord.sourceDocument) !== sourceKey) {
        throw new executionViewContractError_('declaration source must match the DRT source');
      }
      if (Object.prototype.hasOwnProperty.call(declarationIds, declaration.declarationId)) {
        throw new executionViewContractError_('duplicate DRT declaration id');
      }
      declarationIds[declaration.declarationId] = true;
      if (Object.prototype.hasOwnProperty.call(declaration, 'provenance') &&
          declaration.provenance !== null && !isPlainExecutionObject(declaration.provenance)) {
        throw new executionViewContractError_('declaration provenance must be an object or null');
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
        throw new executionViewContractError_('duplicate DRT declaration item');
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
        throw new executionViewContractError_('documentary date entry must be an object');
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
        throw new executionViewContractError_('documentary date entry has missing or unsupported fields');
      }
      if (requiredDateKeys.filter(key => key !== 'product' && key !== 'sourceDocument')
        .some(key => typeof dateItem[key] !== 'string' || !dateItem[key].trim())) {
        throw new executionViewContractError_('documentary date text fields must be non-empty strings');
      }
      if (!dateItem.sourceText.includes(dateItem.dateLabelText) ||
          !dateItem.sourceText.includes(dateItem.dateText)) {
        throw new executionViewContractError_('documentary date literals must occur in sourceText');
      }
      const productReference = copyImmutableExecutionReference(dateItem.product, 'TEST_REPORT');
      const sourceReference = copyImmutableExecutionReference(dateItem.sourceDocument, 'DOCUMENT');
      const productKey = executionReferenceKey(productReference);
      const sourceKey = executionReferenceKey(sourceReference);
      if (!Object.prototype.hasOwnProperty.call(records, productKey) ||
          !Object.prototype.hasOwnProperty.call(records, sourceKey)) {
        throw new executionViewContractError_('documentary date reference is missing from the view');
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
        throw new executionViewContractError_('documentary date source must match the product source');
      }
      if (Object.prototype.hasOwnProperty.call(dateItemIds, dateItem.dateItemId)) {
        throw new executionViewContractError_('duplicate documentary date item id');
      }
      dateItemIds[dateItem.dateItemId] = true;
      const hasProvenance = Object.prototype.hasOwnProperty.call(dateItem, 'provenance');
      if (hasProvenance && dateItem.provenance !== null &&
          !isPlainExecutionObject(dateItem.provenance)) {
        throw new executionViewContractError_('documentary date provenance must be an object or null');
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
    executionViewStateSet_(this, Object.freeze({
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
    const state = executionViewStateGet_(this);
    if (!state) throw new executionViewContractError_('invalid execution view receiver');
    const key = executionReferenceKey(reference);
    return Object.prototype.hasOwnProperty.call(state.byReference, key);
  }

  schemaVersion() {
    const state = executionViewStateGet_(this);
    if (!state) throw new executionViewContractError_('invalid execution view receiver');
    return state.schemaVersion;
  }

  documentaryAssociations(reference) {
    executionViewRecord(this, reference);
    const state = executionViewStateGet_(this);
    if (!state) throw new executionViewContractError_('invalid execution view receiver');
    const key = executionReferenceKey(reference);
    return Object.freeze(state.documentaryAssociations.filter(association =>
      executionReferenceKey(association.left) === key ||
      executionReferenceKey(association.right) === key
    ));
  }

  drtDeclarationItems(reference) {
    const record = executionViewRecord(this, reference);
    if (record.reference.kind !== 'DOCUMENT' ||
        (record.entityId !== 'ART' && record.entityId !== 'RRT' && record.entityId !== 'TRT')) {
      throw new executionViewContractError_(
        'drtDeclarationItems requires a concrete ART, RRT or TRT DOCUMENT reference'
      );
    }
    const state = executionViewStateGet_(this);
    if (!state) throw new executionViewContractError_('invalid execution view receiver');
    const key = executionReferenceKey(reference);
    return Object.freeze(state.drtDeclarationItems.filter(item =>
      executionReferenceKey(item.drt) === key
    ));
  }

  documentaryDateItems(reference) {
    const record = executionViewRecord(this, reference);
    if (record.reference.kind !== 'TEST_REPORT') {
      throw new executionViewContractError_('documentaryDateItems requires a TEST_REPORT reference');
    }
    const state = executionViewStateGet_(this);
    if (!state) throw new executionViewContractError_('invalid execution view receiver');
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
      throw new executionViewContractError_('entityId must be a non-empty string');
    }
    const state = executionViewStateGet_(this);
    if (!state) throw new executionViewContractError_('invalid execution view receiver');
    return Object.freeze(state.orderedReferences.filter(
      reference => state.byReference[executionReferenceKey(reference)].entityId === entityId
    ));
  }

  children(parentReference, entityId) {
    executionViewRecord(this, parentReference);
    if (entityId !== undefined && (typeof entityId !== 'string' || !entityId)) {
      throw new executionViewContractError_('entityId must be a non-empty string when provided');
    }
    const state = executionViewStateGet_(this);
    if (!state) throw new executionViewContractError_('invalid execution view receiver');
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


  function isImmutableExecutionView(view) {
    return executionViewStateHas_(view);
  }

  function intrinsicReferenceKey_(reference) {
    return executionViewStringify_([reference.kind, reference.identifier]);
  }

  function snapshotImmutableExecutionViewEntityRecords_(view, entityId) {
    if (typeof entityId !== 'string' || !entityId) {
      throw new executionViewContractError_('entityId must be a non-empty string');
    }
    const state = executionViewStateGet_(view);
    if (!state) {
      throw new executionViewContractError_('invalid execution view receiver');
    }
    const result = [];
    for (let index = 0; index < state.orderedReferences.length; index += 1) {
      const reference = state.orderedReferences[index];
      const record = state.byReference[intrinsicReferenceKey_(reference)];
      if (record.entityId !== entityId) continue;
      if ((record.value && typeof record.value === 'object' &&
           !executionViewIsFrozen_(record.value)) ||
          (record.hasProvenance && record.provenance &&
           typeof record.provenance === 'object' &&
           !executionViewIsFrozen_(record.provenance))) {
        throw new executionViewContractError_(
          'intrinsic execution-view state must remain immutable'
        );
      }
      const item = {
        reference: executionViewFreeze_({
          kind: record.reference.kind,
          identifier: record.reference.identifier
        }),
        entityId: record.entityId,
        sourceDocument: executionViewFreeze_({
          kind: record.sourceDocument.kind,
          identifier: record.sourceDocument.identifier
        }),
        value: record.value
      };
      if (record.hasProvenance) item.provenance = record.provenance;
      executionViewFreeze_(item);
      result[result.length] = item;
    }
    return executionViewFreeze_(result);
  }

  executionViewFreeze_(ImmutableExecutionView.prototype);
  return executionViewFreeze_({
    ImmutableExecutionView,
    isImmutableExecutionView,
    snapshotImmutableExecutionViewEntityRecords_
  });
})();

Object.defineProperty(globalThis, 'snapshotImmutableExecutionViewEntityRecords', {
  value: snapshotImmutableExecutionViewEntityRecords_,
  enumerable: false,
  writable: false,
  configurable: false
});

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
