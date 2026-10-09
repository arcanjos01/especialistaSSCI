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
const RESPONSIBILITY_INTRINSIC_APPLY_ = Reflect.apply;
const RESPONSIBILITY_INTRINSIC_WEAKMAP_GET_ = WeakMap.prototype.get;
const RESPONSIBILITY_INTRINSIC_WEAKMAP_SET_ = WeakMap.prototype.set;
const RESPONSIBILITY_INTRINSIC_FREEZE_ = Object.freeze;
const RESPONSIBILITY_INTRINSIC_IS_FROZEN_ = Object.isFrozen;
const RESPONSIBILITY_INTRINSIC_IS_ARRAY_ = Array.isArray;
const RESPONSIBILITY_INTRINSIC_IS_FINITE_ = Number.isFinite;
const RESPONSIBILITY_INTRINSIC_KEYS_ = Object.keys;
const RESPONSIBILITY_INTRINSIC_NAMES_ = Object.getOwnPropertyNames;
const RESPONSIBILITY_INTRINSIC_SYMBOLS_ = Object.getOwnPropertySymbols;
const RESPONSIBILITY_INTRINSIC_DESCRIPTOR_ = Object.getOwnPropertyDescriptor;
const RESPONSIBILITY_INTRINSIC_DEFINE_ = Object.defineProperty;
const RESPONSIBILITY_INTRINSIC_CREATE_ = Object.create;
const RESPONSIBILITY_INTRINSIC_HAS_OWN_ = Object.prototype.hasOwnProperty;
const RESPONSIBILITY_INTRINSIC_ARRAY_INDEX_OF_ = Array.prototype.indexOf;
const RESPONSIBILITY_INTRINSIC_STRING_INDEX_OF_ = String.prototype.indexOf;
const RESPONSIBILITY_CANONICAL_CONTRACT_ = isCanonicalCompiledRuntimeContract;
const RESPONSIBILITY_CANONICAL_PLAN_ = isCanonicalFrozenExecutionPlan;
const RESPONSIBILITY_VIEW_CATALOG_AUTHENTICATOR_ = isExecutionViewBackedByEntityCatalog_;

function responsibilityIntrinsicApply_(method, receiver, args) {
  return RESPONSIBILITY_INTRINSIC_APPLY_(method, receiver, args);
}

function responsibilityHasOwn_(value, key) {
  return responsibilityIntrinsicApply_(RESPONSIBILITY_INTRINSIC_HAS_OWN_, value, [key]);
}

function responsibilityArrayIndexOf_(value, item) {
  return responsibilityIntrinsicApply_(RESPONSIBILITY_INTRINSIC_ARRAY_INDEX_OF_, value, [item]);
}

function responsibilityStringIndexOf_(value, item) {
  return responsibilityIntrinsicApply_(RESPONSIBILITY_INTRINSIC_STRING_INDEX_OF_, value, [item]);
}

const RESPONSIBILITY_INTRINSIC_VIEW_SNAPSHOT = (function () {
  const descriptor = RESPONSIBILITY_INTRINSIC_DESCRIPTOR_(
    global, 'snapshotImmutableExecutionViewEntityRecords'
  );
  if (!descriptor ||
      !responsibilityHasOwn_(descriptor, 'value') ||
      typeof descriptor.value !== 'function' ||
      descriptor.writable !== false ||
      descriptor.configurable !== false) {
    throw new ResponsibilityEvidenceIntegrityError(
      'intrinsic immutable execution-view snapshot is required'
    );
  }
  return descriptor.value;
})();

function responsibilityRequire_(condition, message) {
  if (!condition) throw new ResponsibilityEvidenceIntegrityError(message);
}

function responsibilityIdentityContains_(items, candidate) {
  for (let index = 0; index < items.length; index += 1) {
    if (items[index] === candidate) return true;
  }
  return false;
}

function responsibilityStringContains_(items, candidate) {
  for (let index = 0; index < items.length; index += 1) {
    if (items[index] === candidate) return true;
  }
  return false;
}

function responsibilityFreezeCopy_(value, active = []) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && RESPONSIBILITY_INTRINSIC_IS_FINITE_(value)) return value;
  responsibilityRequire_(
    value && typeof value === 'object' && !responsibilityIdentityContains_(active, value),
    'binding data must be finite acyclic JSON-like data'
  );

  const next = [];
  for (let index = 0; index < active.length; index += 1) next[index] = active[index];
  next[next.length] = value;

  if (RESPONSIBILITY_INTRINSIC_IS_ARRAY_(value)) {
    responsibilityRequire_(
      RESPONSIBILITY_INTRINSIC_SYMBOLS_(value).length === 0 &&
      RESPONSIBILITY_INTRINSIC_KEYS_(value).length === value.length &&
      RESPONSIBILITY_INTRINSIC_NAMES_(value).length === value.length + 1,
      'binding arrays must be dense data arrays'
    );
    const copy = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = RESPONSIBILITY_INTRINSIC_DESCRIPTOR_(value, String(index));
      responsibilityRequire_(
        descriptor && responsibilityHasOwn_(descriptor, 'value'),
        'binding arrays cannot contain accessors'
      );
      copy[index] = responsibilityFreezeCopy_(descriptor.value, next);
    }
    return RESPONSIBILITY_INTRINSIC_FREEZE_(copy);
  }

  responsibilityRequire_(
    RESPONSIBILITY_INTRINSIC_SYMBOLS_(value).length === 0 &&
    RESPONSIBILITY_INTRINSIC_NAMES_(value).length === RESPONSIBILITY_INTRINSIC_KEYS_(value).length,
    'binding objects must contain only enumerable data fields'
  );
  const copy = {};
  const keys = RESPONSIBILITY_INTRINSIC_KEYS_(value);
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const descriptor = RESPONSIBILITY_INTRINSIC_DESCRIPTOR_(value, key);
    responsibilityRequire_(
      descriptor && responsibilityHasOwn_(descriptor, 'value'),
      'binding objects cannot contain accessors'
    );
    RESPONSIBILITY_INTRINSIC_DEFINE_(copy, key, {
      value: responsibilityFreezeCopy_(descriptor.value, next),
      enumerable: true,
      writable: false,
      configurable: false
    });
  }
  return RESPONSIBILITY_INTRINSIC_FREEZE_(copy);
}

function responsibilityIntrinsicViewSnapshot_(view, entityId) {
  return RESPONSIBILITY_INTRINSIC_VIEW_SNAPSHOT(view, entityId);
}

function responsibilityAuthenticate_(contract, plan, view) {
  responsibilityRequire_(
    typeof RESPONSIBILITY_CANONICAL_CONTRACT_ === 'function' &&
    RESPONSIBILITY_CANONICAL_CONTRACT_(contract),
    'canonical compiled runtime contract is required'
  );
  responsibilityRequire_(
    typeof RESPONSIBILITY_CANONICAL_PLAN_ === 'function' &&
    RESPONSIBILITY_CANONICAL_PLAN_(plan, contract, view),
    'canonical frozen execution plan bound to this view is required'
  );
  responsibilityRequire_(
    typeof RESPONSIBILITY_VIEW_CATALOG_AUTHENTICATOR_ === 'function' &&
    RESPONSIBILITY_VIEW_CATALOG_AUTHENTICATOR_(view, contract.entityCatalog),
    'execution view must originate from the canonical contract entity catalog'
  );
}

function responsibilityRequirementIsActive_(requirement, plan) {
  if (requirement.forEach === undefined) return true;
  let found = false;
  let active = false;
  for (let index = 0; index < plan.PLANNED_EXECUTION_UNITS.length; index += 1) {
    const unit = plan.PLANNED_EXECUTION_UNITS[index];
    if (!unit || !unit.requirement || unit.requirement.id !== requirement.requirementId) continue;
    found = true;
    responsibilityRequire_(
      unit.iterationSource === requirement.forEach && RESPONSIBILITY_INTRINSIC_IS_ARRAY_(unit.iterationDomain),
      'iterative Requirement has inconsistent frozen domain: ' + requirement.requirementId
    );
    if (unit.iterationDomain.length > 0) active = true;
  }
  responsibilityRequire_(
    found,
    'iterative Requirement is absent from the frozen plan: ' + requirement.requirementId
  );
  return active;
}

function responsibilityMappingFieldsAreAllowed_(mapping) {
  const names = RESPONSIBILITY_INTRINSIC_NAMES_(mapping);
  if (RESPONSIBILITY_INTRINSIC_SYMBOLS_(mapping).length !== 0 ||
      names.length < 2 || names.length > 3) return false;
  let hasResponsibility = false;
  let hasCatalog = false;
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    const descriptor = RESPONSIBILITY_INTRINSIC_DESCRIPTOR_(mapping, name);
    if (!descriptor || !responsibilityHasOwn_(descriptor, 'value')) return false;
    if (name === 'responsibilityId') hasResponsibility = true;
    else if (name === 'catalogIdentifier') hasCatalog = true;
    else if (name !== 'documentaryResponsibilityType') return false;
  }
  return hasResponsibility && hasCatalog;
}

function resolvedRequiredTechnicalResponsibilities(contract, plan, view) {
  responsibilityAuthenticate_(contract, plan, view);
  responsibilityRequire_(
    RESPONSIBILITY_INTRINSIC_IS_ARRAY_(plan.APPLICABLE_REQUIREMENTS) &&
    RESPONSIBILITY_INTRINSIC_IS_FROZEN_(plan.APPLICABLE_REQUIREMENTS),
    'frozen plan has no immutable APPLICABLE_REQUIREMENTS'
  );

  const ordered = [];
  const byKey = RESPONSIBILITY_INTRINSIC_CREATE_(null);

  for (let reqIndex = 0; reqIndex < plan.APPLICABLE_REQUIREMENTS.length; reqIndex += 1) {
    const requirement = plan.APPLICABLE_REQUIREMENTS[reqIndex];
    responsibilityRequire_(
      requirement && typeof requirement.requirementId === 'string',
      'applicable Requirement metadata is invalid'
    );
    if (requirement.responsibilityDomain !== undefined) {
      responsibilityRequire_(
        requirement.responsibilityDomain === 'EACH_REQUIRED_TECHNICAL_RESPONSIBILITY',
        'unknown responsibility domain token'
      );
    }
    if (!responsibilityRequirementIsActive_(requirement, plan)) continue;

    const mappings = requirement.responsibilityMappings || [];
    responsibilityRequire_(RESPONSIBILITY_INTRINSIC_IS_ARRAY_(mappings), 'responsibilityMappings must be an array');

    for (let mapIndex = 0; mapIndex < mappings.length; mapIndex += 1) {
      const mapping = mappings[mapIndex];
      responsibilityRequire_(
        mapping && typeof mapping === 'object' && !RESPONSIBILITY_INTRINSIC_IS_ARRAY_(mapping) &&
        responsibilityMappingFieldsAreAllowed_(mapping),
        'responsibility mapping has unsupported fields'
      );
      responsibilityRequire_(
        typeof mapping.responsibilityId === 'string' && mapping.responsibilityId &&
        typeof mapping.catalogIdentifier === 'string' && mapping.catalogIdentifier &&
        responsibilityStringIndexOf_(mapping.responsibilityId, 'UNRESOLVED_ATTRIBUTE') === -1 &&
        responsibilityStringIndexOf_(mapping.catalogIdentifier, 'UNRESOLVED_ATTRIBUTE') === -1,
        'unresolved or invalid responsibility mapping cannot enter the resolved domain'
      );
      if (mapping.documentaryResponsibilityType !== undefined) {
        responsibilityRequire_(
          typeof mapping.documentaryResponsibilityType === 'string' &&
          /^[A-Z][A-Z0-9_]*$/.test(mapping.documentaryResponsibilityType),
          'documentary responsibility type is invalid'
        );
      }

      const key = mapping.responsibilityId + '\u0000' + mapping.catalogIdentifier;
      if (!responsibilityHasOwn_(byKey, key)) {
        const item = {
          responsibilityId: mapping.responsibilityId,
          catalogIdentifier: mapping.catalogIdentifier,
          requirementIds: [requirement.requirementId]
        };
        if (mapping.documentaryResponsibilityType !== undefined) {
          item.documentaryResponsibilityType = mapping.documentaryResponsibilityType;
        }
        byKey[key] = item;
        ordered[ordered.length] = item;
      } else {
        const item = byKey[key];
        responsibilityRequire_(
          item.documentaryResponsibilityType === mapping.documentaryResponsibilityType,
          'duplicate responsibility mapping has conflicting documentary type'
        );
        if (!responsibilityStringContains_(item.requirementIds, requirement.requirementId)) {
          item.requirementIds[item.requirementIds.length] = requirement.requirementId;
        }
      }
    }
  }

  return responsibilityFreezeCopy_(ordered);
}

function materializeResponsibilityEvidenceBinding(contract, plan, view, catalogIdentifier) {
  responsibilityAuthenticate_(contract, plan, view);
  responsibilityRequire_(
    catalogIdentifier === 'RT-002',
    'responsibility evidence binding is not implemented for ' + catalogIdentifier
  );

  const domain = resolvedRequiredTechnicalResponsibilities(contract, plan, view);
  let responsibility = null;
  let matchCount = 0;
  for (let index = 0; index < domain.length; index += 1) {
    if (domain[index].catalogIdentifier !== catalogIdentifier) continue;
    responsibility = domain[index];
    matchCount += 1;
  }
  responsibilityRequire_(
    matchCount === 1,
    'resolved responsibility must exist exactly once for ' + catalogIdentifier
  );
  responsibilityRequire_(
    typeof responsibility.documentaryResponsibilityType === 'string',
    'resolved responsibility has no documentary responsibility type contract'
  );

  const evidence = [];
  const entityIds = RESPONSIBILITY_INTRINSIC_KEYS_(contract.entityCatalog || {});
  for (let entityIndex = 0; entityIndex < entityIds.length; entityIndex += 1) {
    const entityId = entityIds[entityIndex];
    const definition = contract.entityCatalog[entityId];
    if (!definition ||
        definition.TYPE !== 'DOCUMENT' ||
        definition.EXTENDS !== 'DRT' ||
        definition.ABSTRACT === true) {
      continue;
    }
    responsibilityRequire_(
      RESPONSIBILITY_INTRINSIC_IS_ARRAY_(definition.ATTRIBUTES) &&
      responsibilityArrayIndexOf_(definition.ATTRIBUTES, 'RESPONSIBILITY_TYPE') !== -1 &&
      definition.ATTRIBUTE_TYPES &&
      definition.ATTRIBUTE_TYPES.RESPONSIBILITY_TYPE === 'ENUM',
      'concrete DRT form lacks inherited RESPONSIBILITY_TYPE contract: ' + entityId
    );

    const records = responsibilityIntrinsicViewSnapshot_(view, entityId);
    responsibilityRequire_(RESPONSIBILITY_INTRINSIC_IS_ARRAY_(records) && RESPONSIBILITY_INTRINSIC_IS_FROZEN_(records),
      'intrinsic execution-view snapshot must be immutable');

    for (let recordIndex = 0; recordIndex < records.length; recordIndex += 1) {
      const record = records[recordIndex];
      responsibilityRequire_(
        record && RESPONSIBILITY_INTRINSIC_IS_FROZEN_(record) &&
        record.entityId === entityId &&
        record.reference && record.reference.kind === 'DOCUMENT' &&
        record.sourceDocument && record.sourceDocument.kind === 'DOCUMENT' &&
        record.reference.identifier === record.sourceDocument.identifier,
        'concrete DRT form must be a standalone DOCUMENT source record'
      );

      const facts = record.value;
      if (!facts ||
          facts.RESPONSIBILITY_TYPE !== responsibility.documentaryResponsibilityType) {
        continue;
      }

      evidence[evidence.length] = {
        entityId,
        reference: record.reference,
        sourceDocument: record.sourceDocument,
        provenance: responsibilityHasOwn_(record, 'provenance')
          ? record.provenance : null,
        selectionFact: {
          attribute: 'RESPONSIBILITY_TYPE',
          value: facts.RESPONSIBILITY_TYPE
        }
      };
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

  responsibilityIntrinsicApply_(RESPONSIBILITY_INTRINSIC_WEAKMAP_SET_, RESPONSIBILITY_BINDING_PROVENANCE,
    [binding, RESPONSIBILITY_INTRINSIC_FREEZE_({ contract, plan, view })]);
  return binding;
}

function isCanonicalResponsibilityEvidenceBinding(binding, contract, plan, view) {
  const source = responsibilityIntrinsicApply_(RESPONSIBILITY_INTRINSIC_WEAKMAP_GET_,
    RESPONSIBILITY_BINDING_PROVENANCE, [binding]);
  return !!source &&
    source.contract === contract &&
    source.plan === plan &&
    source.view === view &&
    RESPONSIBILITY_INTRINSIC_IS_FROZEN_(binding) &&
    typeof RESPONSIBILITY_CANONICAL_CONTRACT_ === 'function' &&
    RESPONSIBILITY_CANONICAL_CONTRACT_(contract) &&
    typeof RESPONSIBILITY_CANONICAL_PLAN_ === 'function' &&
    RESPONSIBILITY_CANONICAL_PLAN_(plan, contract, view);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ResponsibilityEvidenceIntegrityError,
    resolvedRequiredTechnicalResponsibilities,
    materializeResponsibilityEvidenceBinding,
    isCanonicalResponsibilityEvidenceBinding,
  };
}

RESPONSIBILITY_INTRINSIC_DEFINE_(global, 'ResponsibilityEvidenceIntegrityError', {
  value: ResponsibilityEvidenceIntegrityError,
  enumerable: true,
  writable: false,
  configurable: false
});
RESPONSIBILITY_INTRINSIC_DEFINE_(global, 'resolvedRequiredTechnicalResponsibilities', {
  value: resolvedRequiredTechnicalResponsibilities,
  enumerable: true,
  writable: false,
  configurable: false
});
RESPONSIBILITY_INTRINSIC_DEFINE_(global, 'materializeResponsibilityEvidenceBinding', {
  value: materializeResponsibilityEvidenceBinding,
  enumerable: true,
  writable: false,
  configurable: false
});
RESPONSIBILITY_INTRINSIC_DEFINE_(global, 'isCanonicalResponsibilityEvidenceBinding', {
  value: isCanonicalResponsibilityEvidenceBinding,
  enumerable: false,
  writable: false,
  configurable: false
});
})(globalThis);
