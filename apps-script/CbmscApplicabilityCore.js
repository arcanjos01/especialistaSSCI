(function (global) {
'use strict';
/** CBMSC-specific, pre-Engine applicability over immutable Process Memory. */

const CBMSC_INTRINSIC_APPLY_ = Reflect.apply;
const CBMSC_INTRINSIC_WEAKMAP_GET_ = WeakMap.prototype.get;
const CBMSC_INTRINSIC_WEAKMAP_SET_ = WeakMap.prototype.set;
const CBMSC_INTRINSIC_FREEZE_ = Object.freeze;
const CBMSC_INTRINSIC_IS_FROZEN_ = Object.isFrozen;
const CBMSC_INTRINSIC_KEYS_ = Object.keys;
const CBMSC_INTRINSIC_DEFINE_ = Object.defineProperty;
const CBMSC_INTRINSIC_HAS_OWN_ = Object.prototype.hasOwnProperty;
const CBMSC_INTRINSIC_ARRAY_FOR_EACH_ = Array.prototype.forEach;
const CBMSC_INTRINSIC_ARRAY_SOME_ = Array.prototype.some;
const CBMSC_INTRINSIC_ARRAY_PUSH_ = Array.prototype.push;
const CBMSC_INTRINSIC_ARRAY_INDEX_OF_ = Array.prototype.indexOf;
const CBMSC_INTRINSIC_SET_ = Set;
const CBMSC_INTRINSIC_SET_HAS_ = Set.prototype.has;
const CBMSC_INTRINSIC_SET_ADD_ = Set.prototype.add;
const CBMSC_INTRINSIC_MAP_ = Map;
const CBMSC_INTRINSIC_MAP_HAS_ = Map.prototype.has;
const CBMSC_INTRINSIC_MAP_SET_ = Map.prototype.set;
const CBMSC_INTRINSIC_MAP_GET_ = Map.prototype.get;
const CBMSC_INTRINSIC_STRING_TRIM_ = String.prototype.trim;
const CBMSC_IS_CANONICAL_CONTRACT_ = isCanonicalCompiledRuntimeContract;
const CBMSC_IS_IMMUTABLE_VIEW_ = isImmutableExecutionView;
const CBMSC_VIEW_CATALOG_AUTHENTICATOR_ = isExecutionViewBackedByEntityCatalog_;

function cbmscArrayApply_(intrinsic, array, args) {
  return CBMSC_INTRINSIC_APPLY_(intrinsic, array, args);
}
function cbmscForEach_(array, callback) {
  return cbmscArrayApply_(CBMSC_INTRINSIC_ARRAY_FOR_EACH_, array, [callback]);
}
function cbmscSetIndex_(array, index, value) {
  CBMSC_INTRINSIC_DEFINE_(array, index, {
    value, enumerable: true, writable: true, configurable: true,
  });
}
function cbmscMap_(array, callback) {
  const result = [];
  result.length = array.length;
  for (let index = 0; index < array.length; index += 1) {
    if (!CBMSC_INTRINSIC_APPLY_(CBMSC_INTRINSIC_HAS_OWN_, array, [index])) continue;
    cbmscSetIndex_(result, index, callback(array[index], index, array));
  }
  return result;
}
function cbmscFilter_(array, callback) {
  const result = [];
  for (let index = 0; index < array.length; index += 1) {
    if (CBMSC_INTRINSIC_APPLY_(CBMSC_INTRINSIC_HAS_OWN_, array, [index]) &&
        callback(array[index], index, array)) {
      cbmscSetIndex_(result, result.length, array[index]);
    }
  }
  return result;
}
function cbmscSome_(array, callback) {
  return cbmscArrayApply_(CBMSC_INTRINSIC_ARRAY_SOME_, array, [callback]);
}
function cbmscSlice_(array) {
  return cbmscMap_(array, value => value);
}
function cbmscConcat_(array, other) {
  const result = cbmscSlice_(array);
  for (let index = 0; index < other.length; index += 1) {
    if (CBMSC_INTRINSIC_APPLY_(CBMSC_INTRINSIC_HAS_OWN_, other, [index])) {
      cbmscSetIndex_(result, result.length, other[index]);
    } else {
      result.length += 1;
    }
  }
  return result;
}
function cbmscPush_(array, value) {
  return cbmscArrayApply_(CBMSC_INTRINSIC_ARRAY_PUSH_, array, [value]);
}
function cbmscIndexOf_(array, value) {
  return cbmscArrayApply_(CBMSC_INTRINSIC_ARRAY_INDEX_OF_, array, [value]);
}
function cbmscSetHas_(set, value) {
  return CBMSC_INTRINSIC_APPLY_(CBMSC_INTRINSIC_SET_HAS_, set, [value]);
}
function cbmscSetAdd_(set, value) {
  return CBMSC_INTRINSIC_APPLY_(CBMSC_INTRINSIC_SET_ADD_, set, [value]);
}
function cbmscMapHas_(map, key) {
  return CBMSC_INTRINSIC_APPLY_(CBMSC_INTRINSIC_MAP_HAS_, map, [key]);
}
function cbmscMapSet_(map, key, value) {
  return CBMSC_INTRINSIC_APPLY_(CBMSC_INTRINSIC_MAP_SET_, map, [key, value]);
}
function cbmscMapGet_(map, key) {
  return CBMSC_INTRINSIC_APPLY_(CBMSC_INTRINSIC_MAP_GET_, map, [key]);
}

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
  if (!value || typeof value !== 'object' || CBMSC_INTRINSIC_IS_FROZEN_(value)) return value;
  const active = seen || [];
  if (cbmscIndexOf_(active, value) >= 0) throw new ApplicabilityBlocker('cyclic applicability result');
  const next = cbmscConcat_(active, [value]);
  cbmscForEach_(CBMSC_INTRINSIC_KEYS_(value), key => cbmscDeepFreeze_(value[key], next));
  return CBMSC_INTRINSIC_FREEZE_(value);
}

function cbmscReferenceSnapshot_(reference) {
  if (!(reference instanceof TypedReference) || !reference.kind || !reference.identifier) {
    throw new ApplicabilityBlocker('incomplete documentary reference');
  }
  return CBMSC_INTRINSIC_FREEZE_({ kind: reference.kind, identifier: reference.identifier });
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
  if (!CBMSC_INTRINSIC_APPLY_(CBMSC_INTRINSIC_HAS_OWN_, object, [field]) || object[field] == null ||
      (typeof object[field] === 'string' &&
       CBMSC_INTRINSIC_APPLY_(CBMSC_INTRINSIC_STRING_TRIM_, object[field], []) === '')) {
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
  const codes = new CBMSC_INTRINSIC_SET_();
  const targets = new CBMSC_INTRINSIC_SET_();
  const canonicalTargets = cbmscFilter_(CBMSC_INTRINSIC_KEYS_(contract.entityCatalog), entityId => {
    const entity = contract.entityCatalog[entityId];
    return entity && entity.APPLICABILITY_TARGET_CLASS === 'OFFICIAL_ESCI_SCOPE';
  });
  if (canonicalTargets.length !== 28) {
    throw new ApplicabilityBlocker('canonical entity catalog does not declare exactly 28 official targets');
  }
  cbmscForEach_(contract.officialEsciTargets, entry => {
    if (!entry || typeof entry.code !== 'string' || typeof entry.entityId !== 'string' ||
        cbmscSetHas_(codes, entry.code) || cbmscSetHas_(targets, entry.entityId)) {
      throw new ApplicabilityBlocker('compiled official target map is invalid');
    }
    const entity = contract.entityCatalog[entry.entityId];
    if (!entity || entity.TYPE !== 'SMSCI' || entity.OFFICIAL_ESCI_CODE !== entry.code ||
        entity.APPLICABILITY_TARGET_CLASS !== 'OFFICIAL_ESCI_SCOPE') {
      throw new ApplicabilityBlocker('compiled official target map conflicts with entity catalog');
    }
    cbmscSetAdd_(codes, entry.code);
    cbmscSetAdd_(targets, entry.entityId);
  });
  if (cbmscSome_(canonicalTargets, entityId => !cbmscSetHas_(targets, entityId))) {
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
  cbmscForEach_(['STRUCTURALLY_COMPLETE', 'LEGIBLE', 'VERIFIABLE'], field => {
    if (sectionAttributes[field] !== true) {
      throw new ApplicabilityBlocker('authorized section guard failed: ' + field);
    }
  });

  const itemReferences = view.children(sectionReference, CBMSC_ITEM_ENTITY);
  const itemTracesByCode = new CBMSC_INTRINSIC_MAP_();
  cbmscForEach_(itemReferences, itemReference => {
    const trace = cbmscTraceRecord_(view, itemReference, CBMSC_ITEM_ENTITY, selectedDocument);
    if (view.parent(itemReference).identifier !== sectionReference.identifier) {
      throw new ApplicabilityBlocker('applicability item is not an explicit child of authorized section');
    }
    const attributes = view.read(itemReference);
    const code = cbmscRequiredField_(attributes, 'OFFICIAL_ESCI_CODE');
    if (!cbmscSome_(compiledContract.officialEsciTargets, entry => entry.code === code)) {
      throw new ApplicabilityBlocker('unknown OFFICIAL_ESCI_CODE: ' + code);
    }
    if (!cbmscMapHas_(itemTracesByCode, code)) cbmscMapSet_(itemTracesByCode, code, []);
    cbmscPush_(cbmscMapGet_(itemTracesByCode, code), { ...trace, attributes });
  });

  const officialDecisions = cbmscMap_(compiledContract.officialEsciTargets, entry => {
    const matchingItems = cbmscMapGet_(itemTracesByCode, entry.code) || [];
    return {
      target: entry.entityId,
      decision: matchingItems.length ? 'POSITIVE' : 'NEGATIVE',
      rule: '02a_applicability: exact OFFICIAL_ESCI_CODE in complete authorized section',
      source: 'OFFICIAL_ESCI_CODE',
      code: entry.code,
      selectedDocument: documentTrace,
      section: sectionTrace,
      itemReferences: cbmscMap_(matchingItems, item => item.reference),
      itemTraces: cbmscMap_(matchingItems, item => ({
        reference: item.reference,
        sourceDocument: item.sourceDocument,
        provenance: item.provenance,
      })),
    };
  });
  if (officialDecisions.length !== 28 ||
      new Set(cbmscMap_(officialDecisions, item => item.target)).size !== 28 ||
      cbmscSome_(officialDecisions, item => !item.selectedDocument || !item.section || !item.rule)) {
    throw new ApplicabilityBlocker('official applicability decision set is incomplete');
  }

  const byTarget = Object.create(null);
  cbmscForEach_(officialDecisions, decision => { byTarget[decision.target] = decision; });
  const derivedDecisions = [];
  const aiPositive = byTarget.SMSCI_AI.decision === 'POSITIVE';
  const daiPositive = byTarget.SMSCI_DAI.decision === 'POSITIVE';
  cbmscPush_(derivedDecisions, {
    target: CBMSC_SDAI_DERIVED,
    decision: aiPositive || daiPositive ? 'POSITIVE' : 'NEGATIVE',
    rule: '02a_applicability: SMSCI_AI positive OR SMSCI_DAI positive',
    sourceDecisions: ['SMSCI_AI', 'SMSCI_DAI'],
    selectedDocument: documentTrace,
    section: sectionTrace,
  });
  const ielPositive = byTarget.SMSCI_IEL.decision === 'POSITIVE';
  cbmscPush_(derivedDecisions, {
    target: CBMSC_IN19_REVIEW_DERIVED,
    decision: ielPositive ? 'NEGATIVE' : 'POSITIVE',
    rule: '02a_applicability: SMSCI_IEL positive => negative review scope; complete negative => positive review scope',
    sourceDecisions: ['SMSCI_IEL'],
    selectedDocument: documentTrace,
    section: sectionTrace,
  });

  const positiveOfficialTargets = cbmscMap_(
    cbmscFilter_(officialDecisions, decision => decision.decision === 'POSITIVE'),
    decision => decision.target
  );
  const processSmsci = cbmscSlice_(positiveOfficialTargets);
  cbmscForEach_(cbmscFilter_(derivedDecisions, decision => decision.decision === 'POSITIVE'),
    decision => cbmscPush_(processSmsci, decision.target));
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
    if (typeof CBMSC_IS_CANONICAL_CONTRACT_ !== 'function' ||
        !CBMSC_IS_CANONICAL_CONTRACT_(contract)) {
      throw new ApplicabilityBlocker('canonical compiled runtime contract is required');
    }
  }

  function requireCanonicalViewCatalog_(view, contract) {
    if (typeof CBMSC_VIEW_CATALOG_AUTHENTICATOR_ !== 'function' ||
        !CBMSC_VIEW_CATALOG_AUTHENTICATOR_(view, contract.entityCatalog)) {
      throw new ApplicabilityBlocker(
        'execution view must originate from the canonical contract entity catalog'
      );
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
    requireCanonicalViewCatalog_(view, compiledContract);
    const resolution = internalResolver(view, currentSubmissionContext, compiledContract);
    if (!CBMSC_INTRINSIC_IS_FROZEN_(resolution) ||
        !resolutionReferencesBelongToView_(resolution, view)) {
      throw new ApplicabilityBlocker(
        'canonical resolver produced an invalid applicability result'
      );
    }
    CBMSC_INTRINSIC_APPLY_(CBMSC_INTRINSIC_WEAKMAP_SET_, provenance,
      [resolution, CBMSC_INTRINSIC_FREEZE_({ view, contract: compiledContract })]);
    return resolution;
  }

  function canonicalResolutionVerifier(resolution, view, contract) {
    const source = CBMSC_INTRINSIC_APPLY_(CBMSC_INTRINSIC_WEAKMAP_GET_, provenance, [resolution]);
    if (!source || source.view !== view || source.contract !== contract ||
        typeof CBMSC_IS_CANONICAL_CONTRACT_ !== 'function' ||
        !CBMSC_IS_CANONICAL_CONTRACT_(contract) ||
        typeof CBMSC_VIEW_CATALOG_AUTHENTICATOR_ !== 'function' ||
        !CBMSC_VIEW_CATALOG_AUTHENTICATOR_(view, contract.entityCatalog) ||
        !CBMSC_IS_IMMUTABLE_VIEW_(view) || !CBMSC_INTRINSIC_IS_FROZEN_(resolution)) {
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
