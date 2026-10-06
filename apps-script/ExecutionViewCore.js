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
  if (!value || Object.prototype.toString.call(value) !== '[object Object]') return false;
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
  const records = EXECUTION_VIEW_RECORDS.get(view);
  if (!records) throw new ExecutionViewContractError('invalid execution view receiver');
  const key = executionReferenceKey(reference);
  if (!Object.prototype.hasOwnProperty.call(records, key)) {
    throw new ExecutionViewLookupError('reference not found: ' + reference.kind + ':' + reference.identifier);
  }
  return records[key];
}

/**
 * Read-only Process Memory contract over explicit canonical projection entries.
 * The caller supplies entries derived from a previously validated RDE; this
 * class stores no RDE and does not define domain projection rules.
 */
class ImmutableExecutionView {
  constructor(projectionEntries) {
    if (!Array.isArray(projectionEntries)) {
      throw new ExecutionViewContractError('projectionEntries must be an array');
    }
    if (Object.getOwnPropertySymbols(projectionEntries).length ||
        Object.keys(projectionEntries).length !== projectionEntries.length) {
      throw new ExecutionViewContractError('projectionEntries must be a dense array');
    }
    const records = Object.create(null);
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
      if (keys.length < 2 || keys.length > 3 ||
          !keys.includes('reference') || !keys.includes('value') ||
          keys.some(key => !['reference', 'value', 'provenance'].includes(key))) {
        throw new ExecutionViewContractError(
          'projection entry requires reference and value, with optional provenance'
        );
      }
      const key = executionReferenceKey(entry.reference);
      if (Object.prototype.hasOwnProperty.call(records, key)) {
        throw new ExecutionViewContractError(
          'duplicate reference: ' + entry.reference.kind + ':' + entry.reference.identifier
        );
      }
      const hasProvenance = Object.prototype.hasOwnProperty.call(entry, 'provenance');
      const record = {
        reference: entry.reference,
        value: immutableExecutionCopy(entry.value),
        hasProvenance,
        provenance: hasProvenance ? immutableExecutionCopy(entry.provenance) : undefined
      };
      Object.freeze(record);
      Object.defineProperty(records, key, {
        value: record, enumerable: true, writable: false, configurable: false
      });
    }
    EXECUTION_VIEW_RECORDS.set(this, Object.freeze(records));
    Object.freeze(this);
  }

  contains(reference) {
    const records = EXECUTION_VIEW_RECORDS.get(this);
    if (!records) throw new ExecutionViewContractError('invalid execution view receiver');
    const key = executionReferenceKey(reference);
    return Object.prototype.hasOwnProperty.call(records, key);
  }

  read(reference) {
    return immutableExecutionCopy(executionViewRecord(this, reference).value);
  }

  provenance(reference) {
    const record = executionViewRecord(this, reference);
    return record.hasProvenance ? immutableExecutionCopy(record.provenance) : undefined;
  }
}
