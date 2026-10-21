(function installCurrentSubmissionContext_(global) {
'use strict';

/**
 * Immutable, request-scoped intake context for the current Habite-se submission.
 * processId is optional technical correlation metadata and never selects a document.
 */

class CurrentSubmissionContextContractError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CurrentSubmissionContextContractError';
    this.code = 'ARCHITECTURAL_BLOCKER';
  }
}

const CURRENT_SUBMISSION_CONTEXT_AUTH_ = new WeakMap();
const CURRENT_CONTEXT_WEAKMAP_SET_ = WeakMap.prototype.set;
const CURRENT_CONTEXT_WEAKMAP_GET_ = WeakMap.prototype.get;
const CURRENT_CONTEXT_WEAKMAP_HAS_ = WeakMap.prototype.has;
const CURRENT_CONTEXT_APPLY_ = Reflect.apply;
const CURRENT_CONTEXT_FREEZE_ = Object.freeze;
const CURRENT_CONTEXT_IS_FROZEN_ = Object.isFrozen;
const CURRENT_CONTEXT_KEYS_ = Object.keys;
const CURRENT_CONTEXT_GET_PROTOTYPE_ = Object.getPrototypeOf;
const CURRENT_CONTEXT_OBJECT_PROTOTYPE_ = Object.prototype;
const CURRENT_CONTEXT_GET_NAMES_ = Object.getOwnPropertyNames;
const CURRENT_CONTEXT_GET_SYMBOLS_ = Object.getOwnPropertySymbols;
const CURRENT_CONTEXT_GET_DESCRIPTOR_ = Object.getOwnPropertyDescriptor;
const CURRENT_CONTEXT_HAS_OWN_ = Object.prototype.hasOwnProperty;
const CURRENT_CONTEXT_ARRAY_SORT_ = Array.prototype.sort;
const CURRENT_CONTEXT_ARRAY_SLICE_ = Array.prototype.slice;
const CURRENT_CONTEXT_ARRAY_JOIN_ = Array.prototype.join;
const CURRENT_CONTEXT_ARRAY_IS_ARRAY_ = Array.isArray;
const CURRENT_CONTEXT_ARRAY_EVERY_ = Array.prototype.every;
const CURRENT_CONTEXT_ARRAY_INCLUDES_ = Array.prototype.includes;
const CURRENT_CONTEXT_ARRAY_FOR_EACH_ = Array.prototype.forEach;
const CURRENT_CONTEXT_ARRAY_PUSH_ = Array.prototype.push;
const CURRENT_CONTEXT_STRING_TRIM_ = String.prototype.trim;
const CURRENT_CONTEXT_JSON_STRINGIFY_ = JSON.stringify;
const CURRENT_CONTEXT_DEFINE_ = Object.defineProperty;
const CURRENT_CONTEXT_NATIVE_OBJECT_PROTOTYPE_NAMES_ = CURRENT_CONTEXT_FREEZE_(
  CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_ARRAY_SORT_, CURRENT_CONTEXT_GET_NAMES_(CURRENT_CONTEXT_OBJECT_PROTOTYPE_), [])
);

const CURRENT_SUBMISSION_DOCUMENT_ENTITY =
  'COMPROVANTE_DE_SOLICITACAO_DE_HABITESE';

function isPlainSubmissionObject(value) {
  if (!value || typeof value !== 'object' || CURRENT_CONTEXT_ARRAY_IS_ARRAY_(value)) return false;
  const prototype = CURRENT_CONTEXT_GET_PROTOTYPE_(value);
  if (prototype === null || prototype === CURRENT_CONTEXT_OBJECT_PROTOTYPE_) return true;
  if (CURRENT_CONTEXT_GET_PROTOTYPE_(prototype) !== null) return false;
  const prototypeNames = CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_ARRAY_SORT_, CURRENT_CONTEXT_GET_NAMES_(prototype), []);
  if (CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_ARRAY_JOIN_, prototypeNames, ['\u0000']) !==
      CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_ARRAY_JOIN_, CURRENT_CONTEXT_NATIVE_OBJECT_PROTOTYPE_NAMES_, ['\u0000'])) return false;
  const constructor = CURRENT_CONTEXT_GET_DESCRIPTOR_(prototype, 'constructor');
  return constructor &&
    CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_HAS_OWN_, constructor, ['value']) &&
    typeof constructor.value === 'function' && constructor.value.name === 'Object';
}

function hasExactSubmissionKeys(value, expectedKeys) {
  if (!isPlainSubmissionObject(value) || CURRENT_CONTEXT_GET_SYMBOLS_(value).length !== 0) return false;
  const keys = CURRENT_CONTEXT_KEYS_(value);
  const names = CURRENT_CONTEXT_GET_NAMES_(value);
  if (names.length !== keys.length || keys.length !== expectedKeys.length) return false;
  for (let index = 0; index < keys.length; index += 1) {
    const descriptor = CURRENT_CONTEXT_GET_DESCRIPTOR_(value, keys[index]);
    if (!descriptor || !CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_HAS_OWN_, descriptor, ['value'])) return false;
  }
  return CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_ARRAY_JOIN_,
      CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_ARRAY_SORT_, CURRENT_CONTEXT_KEYS_(value), []), ['\u0000']) ===
    CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_ARRAY_JOIN_,
      CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_ARRAY_SORT_, CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_ARRAY_SLICE_, expectedKeys, []), []), ['\u0000']);
}

function hasOnlySubmissionDataProperties(value, allowedKeys) {
  if (!isPlainSubmissionObject(value) || CURRENT_CONTEXT_GET_SYMBOLS_(value).length !== 0) return false;
  const keys = CURRENT_CONTEXT_KEYS_(value);
  if (CURRENT_CONTEXT_GET_NAMES_(value).length !== keys.length) return false;
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const descriptor = CURRENT_CONTEXT_GET_DESCRIPTOR_(value, key);
    if (!CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_ARRAY_INCLUDES_, allowedKeys, [key]) ||
        !descriptor || !CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_HAS_OWN_, descriptor, ['value'])) return false;
  }
  return true;
}

function requireSubmissionString(value, name) {
  if (typeof value !== 'string' || CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_STRING_TRIM_, value, []) === '') {
    throw new CurrentSubmissionContextContractError(name + ' must be a non-empty string');
  }
  return value;
}

/** Strict civil-date check; deliberately independent of Date.parse/timezones. */
function isCanonicalCivilDate_(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (year < 1) return false;
  if (month < 1 || month > 12) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= monthDays[month - 1];
}

function createCurrentSubmissionContext(input) {
  if (!isPlainSubmissionObject(input)) {
    throw new CurrentSubmissionContextContractError('context must be a plain object');
  }
  const allowed = ['processId', 'protocolIdentifier', 'requestDate', 'reIdentifier', 'provenance'];
  if (!hasOnlySubmissionDataProperties(input, allowed) ||
      !CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_ARRAY_EVERY_,
        ['protocolIdentifier', 'requestDate', 'provenance'], [key =>
          CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_HAS_OWN_, input, [key])])) {
    throw new CurrentSubmissionContextContractError('context has missing or unknown fields');
  }

  const processId = input.processId == null
    ? null
    : requireSubmissionString(input.processId, 'processId');
  const protocolIdentifier = requireSubmissionString(
    input.protocolIdentifier, 'protocolIdentifier'
  );
  if (!isCanonicalCivilDate_(input.requestDate)) {
    throw new CurrentSubmissionContextContractError(
      'requestDate must be a valid canonical civil date (YYYY-MM-DD)'
    );
  }
  const provenance = input.provenance;
  if (!hasExactSubmissionKeys(provenance, ['sourceKind', 'sourceReference'])) {
    throw new CurrentSubmissionContextContractError(
      'provenance must contain exactly sourceKind and sourceReference'
    );
  }
  const immutableProvenance = CURRENT_CONTEXT_FREEZE_({
    sourceKind: requireSubmissionString(provenance.sourceKind, 'provenance.sourceKind'),
    sourceReference: requireSubmissionString(
      provenance.sourceReference, 'provenance.sourceReference'
    )
  });
  let reIdentifier = null;
  if (CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_HAS_OWN_, input, ['reIdentifier']) && input.reIdentifier != null) {
    reIdentifier = requireSubmissionString(input.reIdentifier, 'reIdentifier');
  }
  const context = CURRENT_CONTEXT_FREEZE_({
    processId,
    protocolIdentifier,
    requestDate: input.requestDate,
    reIdentifier,
    provenance: immutableProvenance
  });
  CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_WEAKMAP_SET_, CURRENT_SUBMISSION_CONTEXT_AUTH_, [context, CURRENT_CONTEXT_FREEZE_({
    protocolIdentifier: context.protocolIdentifier,
    requestDate: context.requestDate,
    reIdentifier: context.reIdentifier,
    provenance: context.provenance
  })]);
  return context;
}

function isCanonicalCurrentSubmissionContext(value) {
  return CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_WEAKMAP_HAS_, CURRENT_SUBMISSION_CONTEXT_AUTH_, [value]) &&
    CURRENT_CONTEXT_IS_FROZEN_(value) && CURRENT_CONTEXT_IS_FROZEN_(value.provenance);
}

function authenticateCurrentSubmissionContext(context) {
  if (!isCanonicalCurrentSubmissionContext(context)) {
    throw new CurrentSubmissionContextContractError('context is not canonical or authenticated');
  }
  return context;
}

function getAuthenticatedPresentationIdentity(context) {
  authenticateCurrentSubmissionContext(context);
  return CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_WEAKMAP_GET_, CURRENT_SUBMISSION_CONTEXT_AUTH_, [context]);
}

/** Stable receipt identity for one presentation, independent of transport metadata. */
function getCanonicalPresentationIdentity(context) {
  const authenticated = getAuthenticatedPresentationIdentity(context);
  const serializedProtocol = CURRENT_CONTEXT_APPLY_(
    CURRENT_CONTEXT_JSON_STRINGIFY_, JSON, [authenticated.protocolIdentifier]
  );
  const serializedRequestDate = CURRENT_CONTEXT_APPLY_(
    CURRENT_CONTEXT_JSON_STRINGIFY_, JSON, [authenticated.requestDate]
  );
  return 'CBMSC_HABITESE_PRESENTATION_V1:' +
    '[' + serializedProtocol + ',' + serializedRequestDate + ']';
}

function currentSubmissionReferenceKey_(reference) {
  if (!(reference instanceof TypedReference)) return null;
  return JSON.stringify([reference.kind, reference.identifier]);
}

/** Selects one comprovante from an immutable view; never reads the raw RDE. */
function selectCurrentComprovante(view, context) {
  if (!(view instanceof ImmutableExecutionView) || !isImmutableExecutionView(view)) {
    throw new CurrentSubmissionContextContractError(
      'selection requires an ImmutableExecutionView'
    );
  }
  const current = createCurrentSubmissionContext(context);
  let candidates;
  try {
    candidates = view.referencesByEntity(CURRENT_SUBMISSION_DOCUMENT_ENTITY);
  } catch (error) {
    throw new CurrentSubmissionContextContractError(
      'cannot enumerate comprovantes in ImmutableExecutionView'
    );
  }
  if (!Array.isArray(candidates)) {
    throw new CurrentSubmissionContextContractError(
      'ImmutableExecutionView returned an invalid candidate collection'
    );
  }

  const matches = [];
  try {
    CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_ARRAY_FOR_EACH_, candidates, [reference => {
      if (view.entityId(reference) !== CURRENT_SUBMISSION_DOCUMENT_ENTITY) return;
      const referenceKey = currentSubmissionReferenceKey_(reference);
      if (!referenceKey) return;
      const sourceDocument = view.sourceDocument(reference);
      if (currentSubmissionReferenceKey_(sourceDocument) !== referenceKey) return;

      const attributes = view.read(reference);
      if (!attributes || typeof attributes !== 'object' ||
          attributes.PROTOCOL_IDENTIFIER !== current.protocolIdentifier ||
          !isCanonicalCivilDate_(attributes.REQUEST_DATE) ||
          attributes.REQUEST_DATE !== current.requestDate) return;

      if (current.reIdentifier !== null &&
          CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_HAS_OWN_, attributes, ['RE_IDENTIFIER']) &&
          attributes.RE_IDENTIFIER !== null &&
          attributes.RE_IDENTIFIER !== current.reIdentifier) return;

      CURRENT_CONTEXT_APPLY_(CURRENT_CONTEXT_ARRAY_PUSH_, matches, [reference]);
    }]);
  } catch (error) {
    if (error instanceof CurrentSubmissionContextContractError) throw error;
    throw new CurrentSubmissionContextContractError(
      'cannot inspect comprovante candidates in ImmutableExecutionView'
    );
  }

  if (matches.length !== 1) {
    throw new CurrentSubmissionContextContractError(
      matches.length === 0
        ? 'no comprovante matches the current submission context'
        : 'multiple comprovantes match the current submission context'
    );
  }
  return matches[0];
}

CURRENT_CONTEXT_DEFINE_(globalThis, 'isCanonicalCurrentSubmissionContext', {
  value: isCanonicalCurrentSubmissionContext, enumerable: false, writable: false, configurable: false
});
CURRENT_CONTEXT_DEFINE_(globalThis, 'authenticateCurrentSubmissionContext', {
  value: authenticateCurrentSubmissionContext, enumerable: false, writable: false, configurable: false
});
CURRENT_CONTEXT_DEFINE_(globalThis, 'getAuthenticatedPresentationIdentity', {
  value: getAuthenticatedPresentationIdentity, enumerable: false, writable: false, configurable: false
});
CURRENT_CONTEXT_DEFINE_(globalThis, 'getCanonicalPresentationIdentity', {
  value: getCanonicalPresentationIdentity, enumerable: false, writable: false, configurable: false
});
CURRENT_CONTEXT_DEFINE_(globalThis, 'selectCurrentComprovante', {
  value: selectCurrentComprovante, enumerable: false, writable: false, configurable: false
});
CURRENT_CONTEXT_DEFINE_(global, 'CurrentSubmissionContextContractError', {
  value: CurrentSubmissionContextContractError, enumerable: true, writable: false, configurable: false
});
CURRENT_CONTEXT_DEFINE_(global, 'createCurrentSubmissionContext', {
  value: createCurrentSubmissionContext, enumerable: true, writable: false, configurable: false
});
CURRENT_CONTEXT_DEFINE_(global, 'isCanonicalCivilDate_', {
  value: isCanonicalCivilDate_, enumerable: false, writable: false, configurable: false
});
})(globalThis);
