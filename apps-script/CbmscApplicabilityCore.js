(function (global) {
'use strict';
/** CBMSC-specific, pre-Engine applicability over immutable Process Memory. */

class ApplicabilityBlocker extends Error {
  constructor(message) {
    super(message);
    this.name = 'ApplicabilityBlocker';
    this.code = 'ARCHITECTURAL_BLOCKER';
  }
}

const CBMSC_COMPROVANTE_ENTITY = 'COMPROVANTE_DE_SOLICITACAO_DE_HABITESE';
const CBMSC_SECTION_ENTITY = 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA';
const CBMSC_ITEM_ENTITY = 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA_ITEM';
const CBMSC_SDAI_DERIVED = 'SMSCI_SDAI';
const CBMSC_IN19_REVIEW_DERIVED = 'SMSCI_IN19_APPLICABILITY_REVIEW';
const CBMSC_IN19_TRANSITION_DATE = '2024-04-24';

function cbmscDeepFreeze_(value, seen) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  const active = seen || [];
  if (active.indexOf(value) >= 0) throw new ApplicabilityBlocker('cyclic applicability result');
  const next = active.concat([value]);
  Object.keys(value).forEach(key => cbmscDeepFreeze_(value[key], next));
  return Object.freeze(value);
}

function cbmscReferenceSnapshot_(reference) {
  if (!(reference instanceof TypedReference) || !reference.kind || !reference.identifier) {
    throw new ApplicabilityBlocker('incomplete documentary reference');
  }
  return Object.freeze({ kind: reference.kind, identifier: reference.identifier });
}

function cbmscTraceRecord_(view, reference, expectedEntity, selectedDocument) {
  if (view.entityId(reference) !== expectedEntity) {
    throw new ApplicabilityBlocker('unexpected entity in applicability relation');
  }
  const sourceDocument = view.sourceDocument(reference);
  if (!(sourceDocument instanceof TypedReference) ||
      sourceDocument.kind !== 'DOCUMENT' ||
      sourceDocument.identifier !== selectedDocument.identifier) {
    throw new ApplicabilityBlocker('applicability trace has inconsistent sourceDocument');
  }
  const provenance = view.provenance(reference);
  return {
    reference: cbmscReferenceSnapshot_(reference),
    sourceDocument: cbmscReferenceSnapshot_(sourceDocument),
    provenance: provenance === undefined ? null : provenance,
  };
}

function cbmscRequiredField_(object, field) {
  if (!Object.prototype.hasOwnProperty.call(object, field) || object[field] == null ||
      (typeof object[field] === 'string' && object[field].trim() === '')) {
    throw new ApplicabilityBlocker('required documentary fact is absent: ' + field);
  }
  return object[field];
}

function validateCbmscRuntimeContract_(contract) {
  if (!contract || contract.contractVersion !== 1 ||
      !contract.entityCatalog || !Array.isArray(contract.officialEsciTargets) ||
      contract.officialEsciTargets.length !== 28) {
    throw new ApplicabilityBlocker('compiled applicability contract is invalid');
  }
  const codes = new Set();
  const targets = new Set();
  const canonicalTargets = Object.keys(contract.entityCatalog).filter(entityId => {
    const entity = contract.entityCatalog[entityId];
    return entity && entity.APPLICABILITY_TARGET_CLASS === 'OFFICIAL_ESCI_SCOPE';
  });
  if (canonicalTargets.length !== 28) {
    throw new ApplicabilityBlocker('canonical entity catalog does not declare exactly 28 official targets');
  }
  contract.officialEsciTargets.forEach(entry => {
    if (!entry || typeof entry.code !== 'string' || typeof entry.entityId !== 'string' ||
        codes.has(entry.code) || targets.has(entry.entityId)) {
      throw new ApplicabilityBlocker('compiled official target map is invalid');
    }
    const entity = contract.entityCatalog[entry.entityId];
    if (!entity || entity.TYPE !== 'SMSCI' || entity.OFFICIAL_ESCI_CODE !== entry.code ||
        entity.APPLICABILITY_TARGET_CLASS !== 'OFFICIAL_ESCI_SCOPE') {
      throw new ApplicabilityBlocker('compiled official target map conflicts with entity catalog');
    }
    codes.add(entry.code);
    targets.add(entry.entityId);
  });
  if (canonicalTargets.some(entityId => !targets.has(entityId))) {
    throw new ApplicabilityBlocker('official target map omits a canonical target');
  }
}

/** Resolves every declared CBMSC official target or blocks without partial output. */
function resolveCbmscApplicabilityInternal_(view, currentSubmissionContext, compiledContract) {
  if (!(view instanceof ImmutableExecutionView) || !isImmutableExecutionView(view)) {
    throw new ApplicabilityBlocker('applicability requires an ImmutableExecutionView');
  }
  validateCbmscRuntimeContract_(compiledContract);
  let immutableContext;
  try {
    immutableContext = createCurrentSubmissionContext(currentSubmissionContext);
  } catch (error) {
    if (error && error.code === 'ARCHITECTURAL_BLOCKER') throw error;
    throw new ApplicabilityBlocker('current submission context is invalid');
  }
  let selectedDocument;
  try {
    selectedDocument = selectCurrentComprovante(view, immutableContext);
  } catch (error) {
    if (error && error.code === 'ARCHITECTURAL_BLOCKER') throw error;
    throw new ApplicabilityBlocker('current comprovante selection failed');
  }
  const documentTrace = cbmscTraceRecord_(
    view, selectedDocument, CBMSC_COMPROVANTE_ENTITY, selectedDocument
  );
  const documentAttributes = view.read(selectedDocument);
  const requestDate = cbmscRequiredField_(documentAttributes, 'REQUEST_DATE');
  const sectionReferences = view.children(selectedDocument, CBMSC_SECTION_ENTITY);
  if (sectionReferences.length !== 1) {
    throw new ApplicabilityBlocker('selected comprovante must have exactly one authorized section');
  }
  const sectionReference = sectionReferences[0];
  const sectionTrace = cbmscTraceRecord_(
    view, sectionReference, CBMSC_SECTION_ENTITY, selectedDocument
  );
  if (view.parent(sectionReference).identifier !== selectedDocument.identifier) {
    throw new ApplicabilityBlocker('authorized section is not an explicit child of selected comprovante');
  }
  const sectionAttributes = view.read(sectionReference);
  ['STRUCTURALLY_COMPLETE', 'LEGIBLE', 'VERIFIABLE'].forEach(field => {
    if (sectionAttributes[field] !== true) {
      throw new ApplicabilityBlocker('authorized section guard failed: ' + field);
    }
  });

  const itemReferences = view.children(sectionReference, CBMSC_ITEM_ENTITY);
  const itemTracesByCode = new Map();
  itemReferences.forEach(itemReference => {
    const trace = cbmscTraceRecord_(view, itemReference, CBMSC_ITEM_ENTITY, selectedDocument);
    if (view.parent(itemReference).identifier !== sectionReference.identifier) {
      throw new ApplicabilityBlocker('applicability item is not an explicit child of authorized section');
    }
    const attributes = view.read(itemReference);
    const code = cbmscRequiredField_(attributes, 'OFFICIAL_ESCI_CODE');
    if (!compiledContract.officialEsciTargets.some(entry => entry.code === code)) {
      throw new ApplicabilityBlocker('unknown OFFICIAL_ESCI_CODE: ' + code);
    }
    if (!itemTracesByCode.has(code)) itemTracesByCode.set(code, []);
    itemTracesByCode.get(code).push({ ...trace, attributes });
  });

  const officialDecisions = compiledContract.officialEsciTargets.map(entry => {
    const matchingItems = itemTracesByCode.get(entry.code) || [];
    return {
      target: entry.entityId,
      decision: matchingItems.length ? 'POSITIVE' : 'NEGATIVE',
      rule: '02a_applicability: exact OFFICIAL_ESCI_CODE in complete authorized section',
      source: 'OFFICIAL_ESCI_CODE',
      code: entry.code,
      selectedDocument: documentTrace,
      section: sectionTrace,
      itemReferences: matchingItems.map(item => item.reference),
      itemTraces: matchingItems.map(item => ({
        reference: item.reference,
        sourceDocument: item.sourceDocument,
        provenance: item.provenance,
      })),
    };
  });
  if (officialDecisions.length !== 28 ||
      new Set(officialDecisions.map(item => item.target)).size !== 28 ||
      officialDecisions.some(item => !item.selectedDocument || !item.section || !item.rule)) {
    throw new ApplicabilityBlocker('official applicability decision set is incomplete');
  }

  const byTarget = Object.create(null);
  officialDecisions.forEach(decision => { byTarget[decision.target] = decision; });
  const derivedDecisions = [];
  const aiPositive = byTarget.SMSCI_AI.decision === 'POSITIVE';
  const daiPositive = byTarget.SMSCI_DAI.decision === 'POSITIVE';
  derivedDecisions.push({
    target: CBMSC_SDAI_DERIVED,
    decision: aiPositive || daiPositive ? 'POSITIVE' : 'NEGATIVE',
    rule: '02a_applicability: SMSCI_AI positive OR SMSCI_DAI positive',
    sourceDecisions: ['SMSCI_AI', 'SMSCI_DAI'],
    selectedDocument: documentTrace,
    section: sectionTrace,
  });
  const ielPositive = byTarget.SMSCI_IEL.decision === 'POSITIVE';
  derivedDecisions.push({
    target: CBMSC_IN19_REVIEW_DERIVED,
    decision: ielPositive ? 'NEGATIVE' : 'POSITIVE',
    rule: '02a_applicability: SMSCI_IEL positive => negative review scope; complete negative => positive review scope',
    sourceDecisions: ['SMSCI_IEL'],
    selectedDocument: documentTrace,
    section: sectionTrace,
  });

  const positiveOfficialTargets = officialDecisions
    .filter(decision => decision.decision === 'POSITIVE')
    .map(decision => decision.target);
  const processSmsci = positiveOfficialTargets.slice();
  derivedDecisions.filter(decision => decision.decision === 'POSITIVE')
    .forEach(decision => processSmsci.push(decision.target));
  let in19DocumentationRegime;
  let in19RegimeTrace;
  if (ielPositive) {
    if (typeof requestDate !== 'string' || !isCanonicalCivilDate_(requestDate)) {
      throw new ApplicabilityBlocker('selected comprovante REQUEST_DATE is not canonical');
    }
    in19DocumentationRegime = requestDate <= CBMSC_IN19_TRANSITION_DATE ? 'LEGACY' : 'CURRENT';
    in19RegimeTrace = {
      source: 'REQUEST_DATE',
      rule: '02a_applicability: REQUEST_DATE <= 2024-04-24 => LEGACY; later => CURRENT',
      selectedDocument: documentTrace,
      decision: in19DocumentationRegime,
    };
  }

  return cbmscDeepFreeze_({
    selectedComprovante: cbmscReferenceSnapshot_(selectedDocument),
    currentSubmissionProvenance: immutableContext.provenance,
    officialDecisions,
    derivedDecisions,
    PROCESS_SMSCI: processSmsci,
    ...(in19DocumentationRegime ? { IN19_DOCUMENTATION_REGIME: in19DocumentationRegime } : {}),
    ...(in19RegimeTrace ? { IN19_DOCUMENTATION_REGIME_TRACE: in19RegimeTrace } : {}),
  });
}

(function (global) {
  const provenance = new WeakMap();
  const internalResolver = resolveCbmscApplicabilityInternal_;

  function requireCanonicalContract_(contract) {
    if (typeof isCanonicalCompiledRuntimeContract !== 'function' ||
        !isCanonicalCompiledRuntimeContract(contract)) {
      throw new ApplicabilityBlocker('canonical compiled runtime contract is required');
    }
  }

  function referenceBelongsToView_(view, snapshot) {
    if (!snapshot || typeof snapshot.kind !== 'string' || !snapshot.kind ||
        typeof snapshot.identifier !== 'string' || !snapshot.identifier) {
      return false;
    }
    try {
      return view.contains(new TypedReference(snapshot.kind, snapshot.identifier));
    } catch (error) {
      return false;
    }
  }

  function traceBelongsToView_(view, trace) {
    return !!trace && referenceBelongsToView_(view, trace.reference) &&
      referenceBelongsToView_(view, trace.sourceDocument);
  }

  function resolutionReferencesBelongToView_(resolution, view) {
    if (!referenceBelongsToView_(view, resolution.selectedComprovante)) return false;
    for (const decision of resolution.officialDecisions || []) {
      if (!traceBelongsToView_(view, decision.selectedDocument) ||
          !traceBelongsToView_(view, decision.section)) return false;
      for (const reference of decision.itemReferences || []) {
        if (!referenceBelongsToView_(view, reference)) return false;
      }
      for (const trace of decision.itemTraces || []) {
        if (!traceBelongsToView_(view, trace)) return false;
      }
    }
    for (const decision of resolution.derivedDecisions || []) {
      if (!traceBelongsToView_(view, decision.selectedDocument) ||
          !traceBelongsToView_(view, decision.section)) return false;
    }
    const regimeTrace = resolution.IN19_DOCUMENTATION_REGIME_TRACE;
    if (regimeTrace && !traceBelongsToView_(view, regimeTrace.selectedDocument)) return false;
    return true;
  }

  function canonicalResolver(view, currentSubmissionContext, compiledContract) {
    requireCanonicalContract_(compiledContract);
    const resolution = internalResolver(view, currentSubmissionContext, compiledContract);
    if (!Object.isFrozen(resolution) ||
        !resolutionReferencesBelongToView_(resolution, view)) {
      throw new ApplicabilityBlocker(
        'canonical resolver produced an invalid applicability result'
      );
    }
    provenance.set(resolution, Object.freeze({ view, contract: compiledContract }));
    return resolution;
  }

  function canonicalResolutionVerifier(resolution, view, contract) {
    const source = provenance.get(resolution);
    if (!source || source.view !== view || source.contract !== contract ||
        typeof isCanonicalCompiledRuntimeContract !== 'function' ||
        !isCanonicalCompiledRuntimeContract(contract) ||
        !isImmutableExecutionView(view) || !Object.isFrozen(resolution)) {
      return false;
    }
    return resolutionReferencesBelongToView_(resolution, view);
  }

  Object.defineProperty(global, 'resolveCbmscApplicability', {
    value: canonicalResolver, enumerable: true, writable: false, configurable: false
  });
  Object.defineProperty(global, 'isCanonicalCbmscApplicabilityResolution', {
    value: canonicalResolutionVerifier, enumerable: false, writable: false, configurable: false
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      ApplicabilityBlocker,
      resolveCbmscApplicability: canonicalResolver,
      isCanonicalCbmscApplicabilityResolution: canonicalResolutionVerifier,
    };
  }
})(globalThis);

Object.defineProperty(global, 'ApplicabilityBlocker', {
  value: ApplicabilityBlocker, enumerable: true, writable: false, configurable: false
});
})(globalThis);
