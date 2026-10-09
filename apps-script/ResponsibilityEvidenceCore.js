(function (global) {
'use strict';
class ResponsibilityEvidenceIntegrityError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ResponsibilityEvidenceIntegrityError';
    this.code = 'RESPONSIBILITY_EVIDENCE_INTEGRITY_ERROR';
  }
}
const RESPONSIBILITY_BINDING_PROVENANCE = new WeakMap();
const SUPPORTED_BINDING_CATALOG_IDS = Object.freeze(['RT-002']);
function responsibilityRequire_(condition, message) {
  if (!condition) throw new ResponsibilityEvidenceIntegrityError(message);
}
function responsibilityFreezeCopy_(value, active = []) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  responsibilityRequire_(value && typeof value === 'object' && !active.includes(value),
    'binding data must be finite acyclic JSON-like data');
  const next = active.concat([value]);
  if (Array.isArray(value)) {
    responsibilityRequire_(Object.getOwnPropertySymbols(value).length === 0 &&
      Object.keys(value).length === value.length &&
      Object.getOwnPropertyNames(value).length === value.length + 1,
    'binding arrays must be dense data arrays');
    return Object.freeze(value.map((item, index) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      responsibilityRequire_(descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value'),
        'binding arrays cannot contain accessors');
      return responsibilityFreezeCopy_(descriptor.value, next);
    }));
  }
  responsibilityRequire_(Object.getOwnPropertySymbols(value).length === 0 &&
    Object.getOwnPropertyNames(value).length === Object.keys(value).length,
  'binding objects must contain only enumerable data fields');
  const copy = {};
  Object.keys(value).forEach(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    responsibilityRequire_(descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value'),
      'binding objects cannot contain accessors');
    Object.defineProperty(copy, key, {
      value: responsibilityFreezeCopy_(descriptor.value, next),
      enumerable: true, writable: false, configurable: false
    });
  });
  return Object.freeze(copy);
}
function responsibilityReferenceSnapshot_(reference) {
  responsibilityRequire_(reference instanceof TypedReference && Object.isFrozen(reference) &&
    typeof reference.kind === 'string' && typeof reference.identifier === 'string' &&
    reference.kind && reference.identifier, 'binding reference must be an immutable TypedReference');
  return Object.freeze({ kind: reference.kind, identifier: reference.identifier });
}
function responsibilityAuthenticate_(contract, plan, view) {
  responsibilityRequire_(typeof isCanonicalCompiledRuntimeContract === 'function' &&
    isCanonicalCompiledRuntimeContract(contract), 'canonical compiled runtime contract is required');
  responsibilityRequire_(typeof isImmutableExecutionView === 'function' &&
    isImmutableExecutionView(view), 'ImmutableExecutionView is required');
  responsibilityRequire_(typeof isCanonicalFrozenExecutionPlan === 'function' &&
    isCanonicalFrozenExecutionPlan(plan, contract, view),
  'canonical frozen execution plan bound to this view is required');
}
function responsibilityRequirementIsActive_(requirement, plan) {
  if (requirement.forEach === undefined) return true;
  const units = plan.PLANNED_EXECUTION_UNITS.filter(unit =>
    unit && unit.requirement && unit.requirement.id === requirement.requirementId);
  responsibilityRequire_(units.length > 0,
    'iterative Requirement is absent from the frozen plan: ' + requirement.requirementId);
  return units.some(unit => {
    responsibilityRequire_(unit.iterationSource === requirement.forEach &&
      Array.isArray(unit.iterationDomain),
    'iterative Requirement has inconsistent frozen domain: ' + requirement.requirementId);
    return unit.iterationDomain.length > 0;
  });
}
function resolvedRequiredTechnicalResponsibilities(contract, plan, view) {
  responsibilityAuthenticate_(contract, plan, view);
  responsibilityRequire_(Array.isArray(plan.APPLICABLE_REQUIREMENTS) &&
    Object.isFrozen(plan.APPLICABLE_REQUIREMENTS),
  'frozen plan has no immutable APPLICABLE_REQUIREMENTS');
  const ordered = [];
  const byKey = Object.create(null);
  for (const requirement of plan.APPLICABLE_REQUIREMENTS) {
    responsibilityRequire_(requirement && typeof requirement.requirementId === 'string',
      'applicable Requirement metadata is invalid');
    if (requirement.responsibilityDomain !== undefined) {
      responsibilityRequire_(requirement.responsibilityDomain ===
        'EACH_REQUIRED_TECHNICAL_RESPONSIBILITY', 'unknown responsibility domain token');
    }
    if (!responsibilityRequirementIsActive_(requirement, plan)) continue;
    const mappings = requirement.responsibilityMappings || [];
    responsibilityRequire_(Array.isArray(mappings), 'responsibilityMappings must be an array');
    for (const mapping of mappings) {
      responsibilityRequire_(mapping && typeof mapping === 'object' && !Array.isArray(mapping),
        'responsibility mapping must be an object');
      const keys = Object.keys(mapping).sort();
      const allowed = ['catalogIdentifier', 'documentaryResponsibilityType', 'responsibilityId'];
      responsibilityRequire_(keys.every(key => allowed.includes(key)) &&
        keys.includes('catalogIdentifier') && keys.includes('responsibilityId'),
      'responsibility mapping has unsupported fields');
      responsibilityRequire_(typeof mapping.responsibilityId === 'string' && mapping.responsibilityId &&
        typeof mapping.catalogIdentifier === 'string' && mapping.catalogIdentifier &&
        !mapping.responsibilityId.includes('UNRESOLVED_ATTRIBUTE') &&
        !mapping.catalogIdentifier.includes('UNRESOLVED_ATTRIBUTE'),
      'unresolved or invalid responsibility mapping cannot enter the resolved domain');
      if (mapping.documentaryResponsibilityType !== undefined) {
        responsibilityRequire_(typeof mapping.documentaryResponsibilityType === 'string' &&
          /^[A-Z][A-Z0-9_]*$/.test(mapping.documentaryResponsibilityType),
        'documentary responsibility type is invalid');
      }
      const key = mapping.responsibilityId + '\u0000' + mapping.catalogIdentifier;
      if (!Object.prototype.hasOwnProperty.call(byKey, key)) {
        const item = {
          responsibilityId: mapping.responsibilityId,
          catalogIdentifier: mapping.catalogIdentifier,
          requirementIds: [requirement.requirementId]
        };
        if (mapping.documentaryResponsibilityType !== undefined) {
          item.documentaryResponsibilityType = mapping.documentaryResponsibilityType;
        }
        byKey[key] = item;
        ordered.push(item);
      } else {
        const item = byKey[key];
        responsibilityRequire_(item.documentaryResponsibilityType === mapping.documentaryResponsibilityType,
          'duplicate responsibility mapping has conflicting documentary type');
        if (!item.requirementIds.includes(requirement.requirementId)) {
          item.requirementIds.push(requirement.requirementId);
        }
      }
    }
  }
  return responsibilityFreezeCopy_(ordered);
}
function materializeResponsibilityEvidenceBinding(contract, plan, view, catalogIdentifier) {
  responsibilityAuthenticate_(contract, plan, view);
  responsibilityRequire_(typeof catalogIdentifier === 'string' && catalogIdentifier,
    'catalogIdentifier must be a non-empty string');
  responsibilityRequire_(SUPPORTED_BINDING_CATALOG_IDS.includes(catalogIdentifier),
    'responsibility evidence binding is not implemented for ' + catalogIdentifier);
  const matches = resolvedRequiredTechnicalResponsibilities(contract, plan, view)
    .filter(item => item.catalogIdentifier === catalogIdentifier);
  responsibilityRequire_(matches.length === 1,
    'resolved responsibility must exist exactly once for ' + catalogIdentifier);
  const responsibility = matches[0];
  responsibilityRequire_(typeof responsibility.documentaryResponsibilityType === 'string',
    'resolved responsibility has no documentary responsibility type contract');
  const evidence = [];
  for (const entityId of Object.keys(contract.entityCatalog || {})) {
    const definition = contract.entityCatalog[entityId];
    if (!definition || definition.TYPE !== 'DRT' || definition.ABSTRACT === true) continue;
    if (!Array.isArray(definition.ATTRIBUTES) ||
        !definition.ATTRIBUTES.includes('RESPONSIBILITY_TYPE') ||
        !definition.ATTRIBUTE_TYPES ||
        definition.ATTRIBUTE_TYPES.RESPONSIBILITY_TYPE !== 'ENUM') continue;
    const references = view.referencesByEntity(entityId);
    responsibilityRequire_(Array.isArray(references),
      'execution view returned an invalid DRT reference collection');
    for (const reference of references) {
      responsibilityRequire_(reference instanceof TypedReference && reference.kind === 'DRT' &&
        view.contains(reference) && view.entityId(reference) === entityId,
      'concrete DRT reference is inconsistent with the execution view');
      const facts = view.read(reference);
      if (!facts || facts.RESPONSIBILITY_TYPE !== responsibility.documentaryResponsibilityType) continue;
      const sourceDocument = view.sourceDocument(reference);
      responsibilityRequire_(sourceDocument instanceof TypedReference &&
        sourceDocument.kind === 'DOCUMENT' && view.contains(sourceDocument),
      'concrete DRT has an invalid source document');
      evidence.push({
        entityId,
        reference: responsibilityReferenceSnapshot_(reference),
        sourceDocument: responsibilityReferenceSnapshot_(sourceDocument),
        provenance: view.provenance(reference) === undefined ? null : view.provenance(reference),
        selectionFact: { attribute: 'RESPONSIBILITY_TYPE', value: facts.RESPONSIBILITY_TYPE }
      });
    }
  }
  const binding = responsibilityFreezeCopy_({
    responsibility: {
      responsibilityId: responsibility.responsibilityId,
      catalogIdentifier: responsibility.catalogIdentifier,
      documentaryResponsibilityType: responsibility.documentaryResponsibilityType,
      requirementIds: responsibility.requirementIds
    },
    evidence
  });
  RESPONSIBILITY_BINDING_PROVENANCE.set(binding, Object.freeze({ contract, plan, view }));
  return binding;
}
function isCanonicalResponsibilityEvidenceBinding(binding, contract, plan, view) {
  const source = RESPONSIBILITY_BINDING_PROVENANCE.get(binding);
  return !!source && source.contract === contract && source.plan === plan && source.view === view &&
    Object.isFrozen(binding) &&
    typeof isCanonicalCompiledRuntimeContract === 'function' &&
    isCanonicalCompiledRuntimeContract(contract) &&
    typeof isCanonicalFrozenExecutionPlan === 'function' &&
    isCanonicalFrozenExecutionPlan(plan, contract, view);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ResponsibilityEvidenceIntegrityError,
    resolvedRequiredTechnicalResponsibilities,
    materializeResponsibilityEvidenceBinding,
    isCanonicalResponsibilityEvidenceBinding,
  };
}
Object.defineProperty(global, 'ResponsibilityEvidenceIntegrityError', {
  value: ResponsibilityEvidenceIntegrityError, enumerable: true, writable: false, configurable: false
});
Object.defineProperty(global, 'resolvedRequiredTechnicalResponsibilities', {
  value: resolvedRequiredTechnicalResponsibilities, enumerable: true, writable: false, configurable: false
});
Object.defineProperty(global, 'materializeResponsibilityEvidenceBinding', {
  value: materializeResponsibilityEvidenceBinding, enumerable: true, writable: false, configurable: false
});
Object.defineProperty(global, 'isCanonicalResponsibilityEvidenceBinding', {
  value: isCanonicalResponsibilityEvidenceBinding, enumerable: false, writable: false, configurable: false
});
})(globalThis);
