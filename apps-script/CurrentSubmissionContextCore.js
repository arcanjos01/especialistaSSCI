/** Immutable operational context for selecting the current Habite-se request. */

class CurrentSubmissionContextContractError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CurrentSubmissionContextContractError';
    this.code = 'ARCHITECTURAL_BLOCKER';
  }
}

const CURRENT_SUBMISSION_DOCUMENT_ENTITY =
  'COMPROVANTE_DE_SOLICITACAO_DE_HABITESE';

function isPlainSubmissionObject(value) {
  if (!value || Object.prototype.toString.call(value) !== '[object Object]') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}

function hasExactSubmissionKeys(value, expectedKeys) {
  return isPlainSubmissionObject(value) &&
    Object.keys(value).sort().join('\u0000') === expectedKeys.slice().sort().join('\u0000');
}

function requireSubmissionString(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
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
  if (Object.keys(input).some(key => !allowed.includes(key)) ||
      !['processId', 'protocolIdentifier', 'requestDate', 'provenance']
        .every(key => Object.prototype.hasOwnProperty.call(input, key))) {
    throw new CurrentSubmissionContextContractError('context has missing or unknown fields');
  }

  const processId = requireSubmissionString(input.processId, 'processId');
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
  const immutableProvenance = Object.freeze({
    sourceKind: requireSubmissionString(provenance.sourceKind, 'provenance.sourceKind'),
    sourceReference: requireSubmissionString(
      provenance.sourceReference, 'provenance.sourceReference'
    )
  });
  let reIdentifier = null;
  if (Object.prototype.hasOwnProperty.call(input, 'reIdentifier') && input.reIdentifier != null) {
    reIdentifier = requireSubmissionString(input.reIdentifier, 'reIdentifier');
  }
  return Object.freeze({
    processId,
    protocolIdentifier,
    requestDate: input.requestDate,
    reIdentifier,
    provenance: immutableProvenance
  });
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
    candidates.forEach(reference => {
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
          Object.prototype.hasOwnProperty.call(attributes, 'RE_IDENTIFIER') &&
          attributes.RE_IDENTIFIER !== null &&
          attributes.RE_IDENTIFIER !== current.reIdentifier) return;

      matches.push(reference);
    });
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
