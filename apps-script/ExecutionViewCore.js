/* Immutable view over entries produced by an authorized projection. */

class ExecutionViewContractError extends Error {}
class ExecutionViewLookupError extends ExecutionViewContractError {}

const {
  ImmutableExecutionView,
  isImmutableExecutionView,
  snapshotImmutableExecutionViewEntityRecords_,
  projectRdeToExecutionView_
} = (function () {
  'use strict';

  const executionViewRecords_ = new WeakMap();
  const executionViewConstructionToken_ = Object.freeze({});
  const executionViewTypedReference_ = TypedReference;
  const executionViewContractError_ = ExecutionViewContractError;
  const executionViewLookupError_ = ExecutionViewLookupError;
  const executionViewReflectApply_ = Reflect.apply;
  const executionViewWeakMapGet_ = WeakMap.prototype.get;
  const executionViewWeakMapSet_ = WeakMap.prototype.set;
  const executionViewWeakMapHas_ = WeakMap.prototype.has;
  const executionViewArrayPush_ = Array.prototype.push;
  const executionViewArrayIncludes_ = Array.prototype.includes;
  const executionViewArraySort_ = Array.prototype.sort;
  const executionViewArrayConcat_ = Array.prototype.concat;
  const executionViewArraySome_ = Array.prototype.some;
  const executionViewArrayFilter_ = Array.prototype.filter;
  const executionViewArrayForEach_ = Array.prototype.forEach;
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
  const executionViewStringIncludes_ = String.prototype.includes;
  const executionViewStringTrim_ = String.prototype.trim;
  const executionViewHasExactKeys_ = hasExactKeys_;
  const executionViewValidateRdeRecordEnvelope_ = validateRdeRecordEnvelope_;
  const executionViewValidateRdeDocumentaryAssociations_ = validateRdeDocumentaryAssociations_;
  const executionViewValidateRdeDrtDeclarationItems_ = validateRdeDrtDeclarationItems_;
  const executionViewValidateRdeDocumentaryDateItems_ = validateRdeDocumentaryDateItems_;
  const executionViewDataViewByteLength_ =
    typeof DataView === 'function'
      ? Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get
      : null;

  function executionViewPush_(array, value) {
    return executionViewReflectApply_(executionViewArrayPush_, array, [value]);
  }

  function executionViewTextIncludes_(value, fragment) {
    return executionViewReflectApply_(executionViewStringIncludes_, value, [fragment]);
  }

  function executionViewTextTrim_(value) {
    return executionViewReflectApply_(executionViewStringTrim_, value, []);
  }

  function executionViewListIncludes_(items, value) {
    return executionViewReflectApply_(executionViewArrayIncludes_, items, [value]);
  }

  function executionViewListSort_(items) {
    return executionViewReflectApply_(executionViewArraySort_, items, []);
  }

  function executionViewListConcat_(items, additions) {
    return executionViewReflectApply_(executionViewArrayConcat_, items, [additions]);
  }

  function executionViewListSome_(items, predicate) {
    return executionViewReflectApply_(executionViewArraySome_, items, [predicate]);
  }

  function executionViewListFilter_(items, predicate) {
    return executionViewReflectApply_(executionViewArrayFilter_, items, [predicate]);
  }

  function executionViewListForEach_(items, callback) {
    return executionViewReflectApply_(executionViewArrayForEach_, items, [callback]);
  }

  function executionViewCanonicalJson_(value) {
    if (value === null || typeof value !== 'object') return executionViewStringify_(value);
    if (executionViewArrayIsArray_(value)) {
      let result = '[';
      for (let index = 0; index < value.length; index += 1) {
        if (index) result += ',';
        result += executionViewCanonicalJson_(value[index]);
      }
      return result + ']';
    }
    const keys = executionViewListSort_(executionViewKeys_(value));
    let result = '{';
    for (let index = 0; index < keys.length; index += 1) {
      if (index) result += ',';
      const key = keys[index];
      result += executionViewStringify_(key) + ':' + executionViewCanonicalJson_(value[key]);
    }
    return result + '}';
  }

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
        typeof kindDescriptor.value !== 'string' || !executionViewTextTrim_(kindDescriptor.value) ||
        typeof identifierDescriptor.value !== 'string' || !executionViewTextTrim_(identifierDescriptor.value) ||
        kindDescriptor.value !== expectedKind) {
      throw new executionViewContractError_('documentary date reference fields are invalid');
    }
    return executionViewFreeze_(new executionViewTypedReference_(
      kindDescriptor.value, identifierDescriptor.value
    ));
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
        if (value[index] !== descriptor.value) {
          throw new executionViewContractError_(
            'projection values cannot contain inconsistent proxy properties'
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
      executionViewListSort_(keys);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        const descriptor = executionViewGetOwnPropertyDescriptor_(value, key);
        if (!descriptor || !executionViewHasOwn_(descriptor, 'value')) {
          throw new executionViewContractError_(
            'projection objects must contain data values'
          );
        }
        if (value[key] !== descriptor.value) {
          throw new executionViewContractError_(
            'projection values cannot contain inconsistent proxy properties'
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

  function executionViewValidateRdeEntityFacts_(records, entityCatalog) {
    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const entityDescriptor = executionViewGetOwnPropertyDescriptor_(entityCatalog, record.entity_id);
      if (!entityDescriptor || !executionViewHasOwn_(entityDescriptor, 'value')) {
        throw new executionViewContractError_('canonical entity definition is missing: ' + record.entity_id);
      }
      const definition = entityDescriptor.value;
      if (!isPlainExecutionObject(definition) ||
          typeof definition.TYPE !== 'string' || !definition.TYPE ||
          !executionViewArrayIsArray_(definition.ATTRIBUTES) ||
          !isPlainExecutionObject(definition.ATTRIBUTE_TYPES) ||
          (definition.ABSTRACT !== undefined && typeof definition.ABSTRACT !== 'boolean')) {
        throw new executionViewContractError_('canonical entity definition is invalid: ' + record.entity_id);
      }
      if (definition.ABSTRACT === true) {
        throw new executionViewContractError_('abstract entity cannot materialize an RDE record: ' + record.entity_id);
      }
      const declared = executionViewCreate_(null);
      for (let attributeIndex = 0; attributeIndex < definition.ATTRIBUTES.length; attributeIndex += 1) {
        const attribute = definition.ATTRIBUTES[attributeIndex];
        if (typeof attribute !== 'string' || !attribute || executionViewHasOwn_(declared, attribute)) {
          throw new executionViewContractError_('canonical entity attributes are invalid: ' + record.entity_id);
        }
        declared[attribute] = true;
      }
      const attributeTypeKeys = executionViewKeys_(definition.ATTRIBUTE_TYPES);
      if (attributeTypeKeys.length !== definition.ATTRIBUTES.length) {
        throw new executionViewContractError_('canonical entity attribute types are incomplete: ' + record.entity_id);
      }
      for (let typeIndex = 0; typeIndex < attributeTypeKeys.length; typeIndex += 1) {
        const typeKey = attributeTypeKeys[typeIndex];
        if (!executionViewHasOwn_(declared, typeKey) ||
            !executionViewListIncludes_(['BOOLEAN', 'DATE', 'ENUM', 'TEXT'],
              definition.ATTRIBUTE_TYPES[typeKey])) {
          throw new executionViewContractError_('canonical entity attribute type is invalid: ' + record.entity_id);
        }
      }
      if (!isPlainExecutionObject(record.attributes)) {
        throw new executionViewContractError_('RDE attributes must be a plain JSON object');
      }
      const attributes = executionViewKeys_(record.attributes);
      for (let attributeIndex = 0; attributeIndex < attributes.length; attributeIndex += 1) {
        const attribute = attributes[attributeIndex];
        const value = record.attributes[attribute];
        const type = definition.ATTRIBUTE_TYPES[attribute];
        if (!executionViewHasOwn_(declared, attribute) ||
            executionViewListIncludes_([
              'record_id', 'entity_id', 'parent_record_id', 'source_document', 'provenance'
            ], attribute) ||
            !(type === 'BOOLEAN' ? typeof value === 'boolean' :
              executionViewListIncludes_(['DATE', 'ENUM', 'TEXT'], type) && typeof value === 'string')) {
          throw new executionViewContractError_(
            'RDE attribute is undeclared or has an incompatible type: ' + record.entity_id + '.' + attribute
          );
        }
      }
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
  if (!executionViewHasOwn_(state.byReference, key)) {
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
    declarationEntries = [], documentaryDateEntries = [], constructionToken) {
    if (constructionToken !== executionViewConstructionToken_) {
      throw new executionViewContractError_(
        'ImmutableExecutionView can only be created from an RDE projection'
      );
    }
    if (!executionViewArrayIsArray_(projectionEntries)) {
      throw new executionViewContractError_('projectionEntries must be an array');
    }
    if (executionViewGetOwnPropertySymbols_(projectionEntries).length ||
        executionViewKeys_(projectionEntries).length !== projectionEntries.length) {
      throw new executionViewContractError_('projectionEntries must be a dense array');
    }
    if (!executionViewArrayIsArray_(associationEntries) ||
        executionViewGetOwnPropertySymbols_(associationEntries).length ||
        executionViewKeys_(associationEntries).length !== associationEntries.length) {
      throw new executionViewContractError_('associationEntries must be a dense array');
    }
    for (let index = 0; index < associationEntries.length; index += 1) {
      const descriptor = executionViewGetOwnPropertyDescriptor_(associationEntries, String(index));
      if (!descriptor || !executionViewHasOwn_(descriptor, 'value')) {
        throw new executionViewContractError_('associationEntries must contain data entries');
      }
    }
    if (!executionViewArrayIsArray_(declarationEntries) ||
        executionViewGetOwnPropertySymbols_(declarationEntries).length ||
        executionViewKeys_(declarationEntries).length !== declarationEntries.length ||
        executionViewGetOwnPropertyNames_(declarationEntries).length !== declarationEntries.length + 1) {
      throw new executionViewContractError_('declarationEntries must be a dense array');
    }
    for (let index = 0; index < declarationEntries.length; index += 1) {
      const descriptor = executionViewGetOwnPropertyDescriptor_(declarationEntries, String(index));
      if (!descriptor || !executionViewHasOwn_(descriptor, 'value')) {
        throw new executionViewContractError_('declarationEntries must contain data entries');
      }
    }
    if (!executionViewArrayIsArray_(documentaryDateEntries) ||
        executionViewGetOwnPropertySymbols_(documentaryDateEntries).length ||
        executionViewKeys_(documentaryDateEntries).length !== documentaryDateEntries.length ||
        executionViewGetOwnPropertyNames_(documentaryDateEntries).length !== documentaryDateEntries.length + 1) {
      throw new executionViewContractError_('documentaryDateEntries must be a dense array');
    }
    for (let index = 0; index < documentaryDateEntries.length; index += 1) {
      const descriptor = executionViewGetOwnPropertyDescriptor_(documentaryDateEntries, String(index));
      if (!descriptor || !executionViewHasOwn_(descriptor, 'value')) {
        throw new executionViewContractError_('documentaryDateEntries must contain data entries');
      }
    }
    if (!executionViewListIncludes_(['0.2.0', '0.3.0', '0.4.0', '0.5.0'], schemaVersion)) {
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
    const records = executionViewCreate_(null);
    const orderedReferences = [];
    const recordIds = executionViewCreate_(null);
    for (let index = 0; index < projectionEntries.length; index += 1) {
      const itemDescriptor = executionViewGetOwnPropertyDescriptor_(projectionEntries, String(index));
      if (!itemDescriptor || !executionViewHasOwn_(itemDescriptor, 'value')) {
        throw new executionViewContractError_('projectionEntries must contain data entries');
      }
      const entry = itemDescriptor.value;
      if (!isPlainExecutionObject(entry)) {
        throw new executionViewContractError_('projection entry must be an object');
      }
      const keys = executionViewListSort_(executionViewKeys_(entry));
      if (executionViewGetOwnPropertySymbols_(entry).length ||
          executionViewGetOwnPropertyNames_(entry).length !== keys.length ||
          executionViewListSome_(keys, key => !executionViewHasOwn_(
            executionViewGetOwnPropertyDescriptor_(entry, key), 'value'
          ))) {
        throw new executionViewContractError_('projection entries must contain only enumerable data fields');
      }
      const required = ['reference', 'entityId', 'parent', 'sourceDocument', 'value'];
      const allowed = executionViewListConcat_(required, ['provenance']);
      if (executionViewListSome_(required, key => !executionViewListIncludes_(keys, key)) ||
          executionViewListSome_(keys, key => !executionViewListIncludes_(allowed, key))) {
        throw new executionViewContractError_(
          'projection entry requires reference, entityId, parent, sourceDocument and value'
        );
      }
      const key = executionReferenceKey(entry.reference);
      if (executionViewHasOwn_(records, key)) {
        throw new executionViewContractError_(
          'duplicate reference: ' + entry.reference.kind + ':' + entry.reference.identifier
        );
      }
      if (executionViewHasOwn_(recordIds, entry.reference.identifier)) {
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
      const hasProvenance = executionViewHasOwn_(entry, 'provenance');
      const record = {
        reference: entry.reference,
        entityId: entry.entityId,
        parent: entry.parent,
        sourceDocument: entry.sourceDocument,
        value: immutableExecutionCopy(entry.value),
        hasProvenance,
        provenance: hasProvenance ? immutableExecutionCopy(entry.provenance) : undefined
      };
      executionViewFreeze_(record);
      executionViewDefineProperty_(records, key, {
        value: record, enumerable: true, writable: false, configurable: false
      });
      recordIds[entry.reference.identifier] = true;
      executionViewPush_(orderedReferences, entry.reference);
    }
    executionViewListForEach_(orderedReferences, reference => {
      const record = records[executionReferenceKey(reference)];
      if (!executionViewHasOwn_(records, executionReferenceKey(record.sourceDocument)) ||
          records[executionReferenceKey(record.sourceDocument)].reference.kind !== 'DOCUMENT') {
        throw new executionViewContractError_('sourceDocument reference is missing from the view');
      }
      if (record.parent &&
          !executionViewHasOwn_(records, executionReferenceKey(record.parent))) {
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
    const relationState = executionViewCreate_(null);
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
    executionViewListForEach_(orderedReferences, reference => visitParent(reference));
    const documentaryAssociations = [];
    const associationIds = executionViewCreate_(null);
    const associationSignatures = executionViewCreate_(null);
    for (let index = 0; index < associationEntries.length; index += 1) {
      const associationDescriptor = executionViewGetOwnPropertyDescriptor_(
        associationEntries, String(index)
      );
      if (!associationDescriptor ||
          !executionViewHasOwn_(associationDescriptor, 'value')) {
        throw new executionViewContractError_('associationEntries must contain data entries');
      }
      const association = associationDescriptor.value;
      if (!isPlainExecutionObject(association)) {
        throw new executionViewContractError_('association entry must be an object');
      }
      const keys = executionViewListSort_(executionViewKeys_(association));
      const requiredAssociationKeys = [
        'associationId', 'left', 'right', 'sourceDocument', 'statementText'
      ];
      const allowedAssociationKeys = executionViewListConcat_(requiredAssociationKeys, ['provenance']);
      if (executionViewGetOwnPropertySymbols_(association).length ||
          executionViewGetOwnPropertyNames_(association).length !== keys.length ||
          executionViewListSome_(keys, key => !executionViewHasOwn_(
            executionViewGetOwnPropertyDescriptor_(association, key), 'value'
          )) || executionViewListSome_(requiredAssociationKeys, key => !executionViewListIncludes_(keys, key)) ||
          executionViewListSome_(keys, key => !executionViewListIncludes_(allowedAssociationKeys, key))) {
        throw new executionViewContractError_('association entry has missing or unsupported fields');
      }
      if (executionViewListSome_(executionViewListFilter_(requiredAssociationKeys, key => key !== 'left' && key !== 'right' &&
          key !== 'sourceDocument'), key =>
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
      executionViewListForEach_([leftKey, rightKey, sourceKey], referenceKey => {
        if (!executionViewHasOwn_(records, referenceKey)) {
          throw new executionViewContractError_('association reference is missing from the view');
        }
      });
      if (records[sourceKey].reference.kind !== 'DOCUMENT') {
        throw new executionViewContractError_('association source must reference a DOCUMENT');
      }
      if (executionViewHasOwn_(associationIds, association.associationId)) {
        throw new executionViewContractError_('duplicate association id');
      }
      associationIds[association.associationId] = true;
      if (executionViewHasOwn_(association, 'provenance') &&
          association.provenance !== null && !isPlainExecutionObject(association.provenance)) {
        throw new executionViewContractError_('association provenance must be an object or null');
      }
      const hasProvenance = executionViewHasOwn_(association, 'provenance');
      const copiedProvenance = hasProvenance
        ? immutableExecutionCopy(association.provenance) : undefined;
      const endpoints = executionViewListSort_([leftKey, rightKey]);
      const signature = executionViewCanonicalJson_({
        endpoints,
        sourceDocument: sourceKey,
        statementText: association.statementText,
        hasProvenance,
        provenance: hasProvenance ? copiedProvenance : null
      });
      if (executionViewHasOwn_(associationSignatures, signature)) {
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
      executionViewPush_(documentaryAssociations, executionViewFreeze_(projected));
    }
    const drtDeclarationItems = [];
    const declarationIds = executionViewCreate_(null);
    const declarationSignatures = executionViewCreate_(null);
    for (let index = 0; index < declarationEntries.length; index += 1) {
      const descriptor = executionViewGetOwnPropertyDescriptor_(declarationEntries, String(index));
      const declaration = descriptor.value;
      if (!isPlainExecutionObject(declaration)) {
        throw new executionViewContractError_('declaration entry must be an object');
      }
      const keys = executionViewListSort_(executionViewKeys_(declaration));
      const requiredDeclarationKeys = [
        'declarationId', 'drt', 'activityServiceText', 'smsciScopeText',
        'sourceDocument', 'sourceText'
      ];
      const allowedDeclarationKeys = executionViewListConcat_(requiredDeclarationKeys, ['provenance']);
      if (executionViewGetOwnPropertySymbols_(declaration).length ||
          executionViewGetOwnPropertyNames_(declaration).length !== keys.length ||
          executionViewListSome_(keys, key => !executionViewHasOwn_(
            executionViewGetOwnPropertyDescriptor_(declaration, key), 'value'
          )) || executionViewListSome_(requiredDeclarationKeys, key => !executionViewListIncludes_(keys, key)) ||
          executionViewListSome_(keys, key => !executionViewListIncludes_(allowedDeclarationKeys, key))) {
        throw new executionViewContractError_('declaration entry has missing or unsupported fields');
      }
      if (executionViewListSome_(executionViewListFilter_(requiredDeclarationKeys, key =>
          key !== 'drt' && key !== 'sourceDocument'), key =>
          typeof declaration[key] !== 'string' || !executionViewTextTrim_(declaration[key]))) {
        throw new executionViewContractError_('declaration text fields must be non-empty strings');
      }
      if (!executionViewTextIncludes_(declaration.sourceText, declaration.activityServiceText) ||
          !executionViewTextIncludes_(declaration.sourceText, declaration.smsciScopeText)) {
        throw new executionViewContractError_('declaration literals must occur in sourceText');
      }
      if (!(declaration.drt instanceof executionViewTypedReference_) || declaration.drt.kind !== 'DOCUMENT' ||
          !(declaration.sourceDocument instanceof executionViewTypedReference_) ||
          declaration.sourceDocument.kind !== 'DOCUMENT') {
        throw new executionViewContractError_('declaration references are invalid');
      }
      const drtKey = executionReferenceKey(declaration.drt);
      const sourceKey = executionReferenceKey(declaration.sourceDocument);
      if (!executionViewHasOwn_(records, drtKey) ||
          !executionViewHasOwn_(records, sourceKey)) {
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
      if (executionViewHasOwn_(declarationIds, declaration.declarationId)) {
        throw new executionViewContractError_('duplicate DRT declaration id');
      }
      declarationIds[declaration.declarationId] = true;
      if (executionViewHasOwn_(declaration, 'provenance') &&
          declaration.provenance !== null && !isPlainExecutionObject(declaration.provenance)) {
        throw new executionViewContractError_('declaration provenance must be an object or null');
      }
      const hasProvenance = executionViewHasOwn_(declaration, 'provenance');
      if (hasProvenance) assertStrictExecutionJsonValue(declaration.provenance);
      const copiedProvenance = hasProvenance
        ? immutableExecutionCopy(declaration.provenance) : undefined;
      const signature = executionViewCanonicalJson_({
        drt: drtKey,
        activityServiceText: declaration.activityServiceText,
        smsciScopeText: declaration.smsciScopeText,
        sourceDocument: sourceKey,
        sourceText: declaration.sourceText,
        hasProvenance,
        provenance: hasProvenance ? copiedProvenance : null
      });
      if (executionViewHasOwn_(declarationSignatures, signature)) {
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
      executionViewPush_(drtDeclarationItems, executionViewFreeze_(projected));
    }
    const documentaryDateItems = [];
    const dateItemIds = executionViewCreate_(null);
    for (let index = 0; index < documentaryDateEntries.length; index += 1) {
      const descriptor = executionViewGetOwnPropertyDescriptor_(documentaryDateEntries, String(index));
      const dateItem = descriptor.value;
      if (!isPlainExecutionObject(dateItem)) {
        throw new executionViewContractError_('documentary date entry must be an object');
      }
      const keys = executionViewListSort_(executionViewKeys_(dateItem));
      const requiredDateKeys = [
        'dateItemId', 'product', 'dateLabelText', 'dateText', 'sourceDocument', 'sourceText'
      ];
      const allowedDateKeys = executionViewListConcat_(requiredDateKeys, ['provenance']);
      if (executionViewGetOwnPropertySymbols_(dateItem).length ||
          executionViewGetOwnPropertyNames_(dateItem).length !== keys.length ||
          executionViewListSome_(keys, key => !executionViewHasOwn_(
            executionViewGetOwnPropertyDescriptor_(dateItem, key), 'value'
          )) || executionViewListSome_(requiredDateKeys, key => !executionViewListIncludes_(keys, key)) ||
          executionViewListSome_(keys, key => !executionViewListIncludes_(allowedDateKeys, key))) {
        throw new executionViewContractError_('documentary date entry has missing or unsupported fields');
      }
      if (executionViewListSome_(executionViewListFilter_(requiredDateKeys, key =>
          key !== 'product' && key !== 'sourceDocument'), key =>
          typeof dateItem[key] !== 'string' || !executionViewTextTrim_(dateItem[key]))) {
        throw new executionViewContractError_('documentary date text fields must be non-empty strings');
      }
      if (!executionViewTextIncludes_(dateItem.sourceText, dateItem.dateLabelText) ||
          !executionViewTextIncludes_(dateItem.sourceText, dateItem.dateText)) {
        throw new executionViewContractError_('documentary date literals must occur in sourceText');
      }
      const productReference = copyImmutableExecutionReference(dateItem.product, 'TEST_REPORT');
      const sourceReference = copyImmutableExecutionReference(dateItem.sourceDocument, 'DOCUMENT');
      const productKey = executionReferenceKey(productReference);
      const sourceKey = executionReferenceKey(sourceReference);
      if (!executionViewHasOwn_(records, productKey) ||
          !executionViewHasOwn_(records, sourceKey)) {
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
      if (executionViewHasOwn_(dateItemIds, dateItem.dateItemId)) {
        throw new executionViewContractError_('duplicate documentary date item id');
      }
      dateItemIds[dateItem.dateItemId] = true;
      const hasProvenance = executionViewHasOwn_(dateItem, 'provenance');
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
      executionViewPush_(documentaryDateItems, executionViewFreeze_(projected));
    }
    executionViewStateSet_(this, executionViewFreeze_({
      byReference: executionViewFreeze_(records),
      orderedReferences: executionViewFreeze_(orderedReferences),
      documentaryAssociations: executionViewFreeze_(documentaryAssociations),
      drtDeclarationItems: executionViewFreeze_(drtDeclarationItems),
      documentaryDateItems: executionViewFreeze_(documentaryDateItems),
      schemaVersion
    }));
    executionViewFreeze_(this);
  }

  contains(reference) {
    const state = executionViewStateGet_(this);
    if (!state) throw new executionViewContractError_('invalid execution view receiver');
    const key = executionReferenceKey(reference);
    return executionViewHasOwn_(state.byReference, key);
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
    return executionViewFreeze_(executionViewListFilter_(state.documentaryAssociations, association =>
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
    return executionViewFreeze_(executionViewListFilter_(state.drtDeclarationItems, item =>
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
    return executionViewFreeze_(executionViewListFilter_(state.documentaryDateItems, item =>
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
    return executionViewFreeze_(executionViewListFilter_(state.orderedReferences,
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
    return executionViewFreeze_(executionViewListFilter_(state.orderedReferences, reference => {
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

/** Create the closed documentary projection from a validated RDE 0.2.0 through 0.5.0. */
function projectRdeToExecutionView_(rde, entityCatalog) {
  // Snapshot caller-owned input once, then validate and project that immutable data.
  // This prevents a Proxy from supplying one fact to validation and another to Process Memory.
  rde = immutableExecutionCopy(rde);
  entityCatalog = immutableExecutionCopy(entityCatalog);
  if (!rde || typeof rde !== 'object' || executionViewArrayIsArray_(rde)) {
    throw new executionViewContractError_('projection requires a validated RDE 0.2.0 through 0.5.0');
  }
  const schemaDescriptor = executionViewGetOwnPropertyDescriptor_(rde, 'schema_version');
  if (!schemaDescriptor || !executionViewHasOwn_(schemaDescriptor, 'value') ||
      !executionViewListIncludes_(['0.2.0', '0.3.0', '0.4.0', '0.5.0'], schemaDescriptor.value)) {
    throw new executionViewContractError_('projection requires a validated RDE 0.2.0 through 0.5.0');
  }
  const schemaVersion = schemaDescriptor.value;
  if (schemaVersion === '0.2.0' &&
      (executionViewHasOwn_(rde, 'documentary_associations') ||
       executionViewHasOwn_(rde, 'drt_declaration_items') ||
       executionViewHasOwn_(rde, 'documentary_date_items'))) {
    throw new executionViewContractError_('RDE 0.2.0 cannot declare documentary associations');
  }
  const expectedKeys = [
    'schema_version', 'process_id', 'source', 'extraction', 'records', 'extraction_warnings'
  ];
  if (schemaVersion === '0.3.0' || schemaVersion === '0.4.0' || schemaVersion === '0.5.0') {
    executionViewPush_(expectedKeys, 'documentary_associations');
  }
  if (schemaVersion === '0.4.0' || schemaVersion === '0.5.0') executionViewPush_(expectedKeys, 'drt_declaration_items');
  if (schemaVersion === '0.5.0') executionViewPush_(expectedKeys, 'documentary_date_items');
  if (!executionViewHasExactKeys_(rde, expectedKeys) || !executionViewArrayIsArray_(rde.records)) {
    throw new executionViewContractError_('projection requires a validated RDE 0.2.0 through 0.5.0');
  }
  const documentaryAssociations = schemaVersion === '0.3.0' || schemaVersion === '0.4.0' ||
    schemaVersion === '0.5.0'
    ? executionViewGetOwnPropertyDescriptor_(rde, 'documentary_associations').value : [];
  const drtDeclarationItems = schemaVersion === '0.4.0' || schemaVersion === '0.5.0'
    ? executionViewGetOwnPropertyDescriptor_(rde, 'drt_declaration_items').value : [];
  const documentaryDateItems = schemaVersion === '0.5.0'
    ? executionViewGetOwnPropertyDescriptor_(rde, 'documentary_date_items').value : [];
  if (!entityCatalog || typeof entityCatalog !== 'object') {
    throw new executionViewContractError_('entityCatalog is required for RDE projection');
  }
  executionViewValidateRdeRecordEnvelope_(rde.records, entityCatalog);
  executionViewValidateRdeEntityFacts_(rde.records, entityCatalog);
  if (schemaVersion === '0.3.0' || schemaVersion === '0.4.0' || schemaVersion === '0.5.0') {
    executionViewValidateRdeDocumentaryAssociations_(documentaryAssociations, rde.records, entityCatalog);
  }
  if (schemaVersion === '0.4.0' || schemaVersion === '0.5.0') {
    executionViewValidateRdeDrtDeclarationItems_(drtDeclarationItems, rde.records, entityCatalog);
  }
  if (schemaVersion === '0.5.0') {
    executionViewValidateRdeDocumentaryDateItems_(documentaryDateItems, rde.records, entityCatalog);
  }
  const referencesByRecordId = executionViewCreate_(null);
  for (let index = 0; index < rde.records.length; index += 1) {
    const recordDescriptor = executionViewGetOwnPropertyDescriptor_(rde.records, String(index));
    if (!recordDescriptor || !executionViewHasOwn_(recordDescriptor, 'value')) {
      throw new executionViewContractError_('RDE record entry is invalid');
    }
    const record = recordDescriptor.value;
    if (!executionViewHasOwn_(entityCatalog, record.entity_id) ||
        !entityCatalog[record.entity_id] || typeof entityCatalog[record.entity_id].TYPE !== 'string') {
      throw new executionViewContractError_('canonical entity TYPE is missing: ' + record.entity_id);
    }
    if (executionViewHasOwn_(referencesByRecordId, record.record_id)) {
      throw new executionViewContractError_('duplicate record_id: ' + record.record_id);
    }
      referencesByRecordId[record.record_id] = executionViewFreeze_(
        new executionViewTypedReference_(
          entityCatalog[record.entity_id].TYPE,
          record.record_id
        )
      );
  }
  const entries = [];
  for (let index = 0; index < rde.records.length; index += 1) {
    const recordDescriptor = executionViewGetOwnPropertyDescriptor_(rde.records, String(index));
    if (!recordDescriptor || !executionViewHasOwn_(recordDescriptor, 'value')) {
      throw new executionViewContractError_('RDE record entry is invalid');
    }
    const record = recordDescriptor.value;
    const reference = referencesByRecordId[record.record_id];
    const parent = record.parent_record_id === null
      ? null : referencesByRecordId[record.parent_record_id];
    const sourceDocument = referencesByRecordId[record.source_document];
    if (!sourceDocument) {
      throw new executionViewContractError_('source_document reference is missing: ' + record.source_document);
    }
    if (record.parent_record_id !== null && !parent) {
      throw new executionViewContractError_('parent reference is missing: ' + record.parent_record_id);
    }
    const entry = {
      reference,
      entityId: record.entity_id,
      parent,
      sourceDocument,
      value: record.attributes
    };
    if (executionViewHasOwn_(record, 'provenance')) {
      entry.provenance = record.provenance;
    }
    executionViewPush_(entries, entry);
  }
  const associations = [];
  if (schemaVersion === '0.3.0' || schemaVersion === '0.4.0' || schemaVersion === '0.5.0') {
    for (let index = 0; index < documentaryAssociations.length; index += 1) {
      const associationDescriptor = executionViewGetOwnPropertyDescriptor_(
        documentaryAssociations, String(index)
      );
      if (!associationDescriptor ||
          !executionViewHasOwn_(associationDescriptor, 'value')) {
        throw new executionViewContractError_('documentary association entry is invalid');
      }
      const association = associationDescriptor.value;
      executionViewPush_(associations, {
        associationId: association.association_id,
        left: referencesByRecordId[association.left_record_id],
        right: referencesByRecordId[association.right_record_id],
        sourceDocument: referencesByRecordId[association.source_document],
        statementText: association.statement_text,
        ...(executionViewHasOwn_(association, 'provenance')
          ? { provenance: association.provenance } : {})
      });
    }
  }
  const declarations = [];
  if (schemaVersion === '0.4.0' || schemaVersion === '0.5.0') {
    for (let index = 0; index < drtDeclarationItems.length; index += 1) {
      const declarationDescriptor = executionViewGetOwnPropertyDescriptor_(drtDeclarationItems, String(index));
      if (!declarationDescriptor ||
          !executionViewHasOwn_(declarationDescriptor, 'value')) {
        throw new executionViewContractError_('DRT declaration item is invalid');
      }
      const declaration = declarationDescriptor.value;
      executionViewPush_(declarations, {
        declarationId: declaration.declaration_id,
        drt: referencesByRecordId[declaration.drt_record_id],
        activityServiceText: declaration.activity_service_text,
        smsciScopeText: declaration.smsci_scope_text,
        sourceDocument: referencesByRecordId[declaration.source_document],
        sourceText: declaration.source_text,
        ...(executionViewHasOwn_(declaration, 'provenance')
          ? { provenance: declaration.provenance } : {})
      });
    }
  }
  const dates = [];
  if (schemaVersion === '0.5.0') {
    for (let index = 0; index < documentaryDateItems.length; index += 1) {
      const dateDescriptor = executionViewGetOwnPropertyDescriptor_(documentaryDateItems, String(index));
      if (!dateDescriptor || !executionViewHasOwn_(dateDescriptor, 'value')) {
        throw new executionViewContractError_('documentary date item is invalid');
      }
      const dateItem = dateDescriptor.value;
      executionViewPush_(dates, {
        dateItemId: dateItem.date_item_id,
        product: referencesByRecordId[dateItem.product_record_id],
        dateLabelText: dateItem.date_label_text,
        dateText: dateItem.date_text,
        sourceDocument: referencesByRecordId[dateItem.source_document],
        sourceText: dateItem.source_text,
        ...(executionViewHasOwn_(dateItem, 'provenance')
          ? { provenance: dateItem.provenance } : {})
      });
    }
  }
  return new ImmutableExecutionView(
    entries, associations, schemaVersion, declarations, dates, executionViewConstructionToken_
  );
}

  executionViewFreeze_(ImmutableExecutionView.prototype);
  return executionViewFreeze_({
    ImmutableExecutionView,
    isImmutableExecutionView,
    snapshotImmutableExecutionViewEntityRecords_,
    projectRdeToExecutionView_
  });
})();

Object.defineProperty(globalThis, 'snapshotImmutableExecutionViewEntityRecords', {
  value: snapshotImmutableExecutionViewEntityRecords_,
  enumerable: false,
  writable: false,
  configurable: false
});
Object.defineProperty(globalThis, 'projectRdeToExecutionView_', {
  value: projectRdeToExecutionView_,
  enumerable: true,
  writable: false,
  configurable: false
});
