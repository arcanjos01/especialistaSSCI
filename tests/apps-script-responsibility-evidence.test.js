const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {};
vm.createContext(context);
for (const relativePath of [
  '../apps-script/CompiledRuntimeContract.js',
  '../apps-script/EngineCore.js',
  '../apps-script/RdeCore.js',
  '../apps-script/ExecutionViewCore.js',
  '../apps-script/CurrentSubmissionContextCore.js',
  '../apps-script/CbmscApplicabilityCore.js',
  '../apps-script/ExecutionPlanCore.js',
  '../apps-script/ResponsibilityEvidenceCore.js'
]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, relativePath), 'utf8'), context);
}
vm.runInContext(`globalThis.api = {
  COMPILED_RUNTIME_CONTRACT,
  isCanonicalCompiledRuntimeContract,
  TypedReference,
  createCurrentSubmissionContext,
  projectRdeToExecutionView_,
  parseAndValidateOperationalRdeJson_,
  isCanonicalValidatedExecutionRde_,
  resolveCbmscApplicability,
  materializeFrozenExecutionPlan,
  resolvedRequiredTechnicalResponsibilities,
  materializeResponsibilityEvidenceBinding,
  isCanonicalFrozenExecutionPlan,
  isCanonicalCbmscApplicabilityResolution,
  isCanonicalResponsibilityEvidenceBinding,
  ResponsibilityEvidenceIntegrityError
};`, context);
const api = context.api;
const contract = api.COMPILED_RUNTIME_CONTRACT;

for (const name of [
  'resolvedRequiredTechnicalResponsibilities',
  'materializeResponsibilityEvidenceBinding',
  'isCanonicalResponsibilityEvidenceBinding'
]) {
  const descriptor = vm.runInContext(
    "Object.getOwnPropertyDescriptor(globalThis, " + JSON.stringify(name) + ")", context
  );
  assert.equal(descriptor.writable, false, name);
  assert.equal(descriptor.configurable, false, name);
}
assert.equal(vm.runInContext("typeof responsibilityRequire_", context), 'undefined');
assert.equal(vm.runInContext("typeof responsibilityFreezeCopy_", context), 'undefined');

assert.throws(
  () => vm.runInContext('EXECUTION_VIEW_RECORDS', context),
  /not defined/
);
assert.throws(
  () => vm.runInContext('executionViewRecords_', context),
  /not defined/
);
assert.throws(
  () => vm.runInContext('executionViewStateSet_', context),
  /not defined/
);

assert.equal(
  vm.runInContext("Object.isFrozen(ImmutableExecutionView.prototype)", context),
  true
);
for (const methodName of [
  'contains', 'read', 'entityId', 'sourceDocument', 'referencesByEntity', 'provenance'
]) {
  const descriptor = vm.runInContext(
    "Object.getOwnPropertyDescriptor(ImmutableExecutionView.prototype, " +
      JSON.stringify(methodName) + ")",
    context
  );
  assert.equal(descriptor.writable, false, methodName);
  assert.equal(descriptor.configurable, false, methodName);
}
const snapshotDescriptor = vm.runInContext(
  "Object.getOwnPropertyDescriptor(globalThis, 'snapshotImmutableExecutionViewEntityRecords')",
  context
);
assert.equal(typeof snapshotDescriptor.value, 'function');
assert.equal(snapshotDescriptor.writable, false);
assert.equal(snapshotDescriptor.configurable, false);
assert.equal(
  vm.runInContext(
    "Reflect.set(ImmutableExecutionView.prototype, 'referencesByEntity', function(){ return []; })",
    context
  ),
  false
);

function currentContext() {
  return api.createCurrentSubmissionContext({
    protocolIdentifier: 'TEST_ONLY_PROTOCOL',
    requestDate: '2026-01-28',
    reIdentifier: 'TEST_ONLY_RE',
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'TEST_ONLY_INTAKE' }
  });
}

function buildRde(codes = [], drts = []) {
  const records = [{
    record_id: 'DOC_CURRENT',
    entity_id: 'COMPROVANTE_DE_SOLICITACAO_DE_HABITESE',
    parent_record_id: null,
    source_document: 'DOC_CURRENT',
    attributes: {
      PROTOCOL_IDENTIFIER: 'TEST_ONLY_PROTOCOL',
      REQUEST_DATE: '2026-01-28',
      RE_IDENTIFIER: 'TEST_ONLY_RE'
    },
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'CURRENT' }
  }, {
    record_id: 'SECTION_CURRENT',
    entity_id: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA',
    parent_record_id: 'DOC_CURRENT',
    source_document: 'DOC_CURRENT',
    attributes: { STRUCTURALLY_COMPLETE: true, LEGIBLE: true, VERIFIABLE: true },
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'SECTION' }
  }];

  codes.forEach((code, index) => records.push({
    record_id: 'ITEM_' + index,
    entity_id: 'SISTEMAS_E_MEDIDAS_DE_SEGURANCA_ITEM',
    parent_record_id: 'SECTION_CURRENT',
    source_document: 'DOC_CURRENT',
    attributes: {
      OFFICIAL_ESCI_CODE: code,
      PRESENTED_SYSTEM_MEASURE_DESCRIPTION: 'TEST ' + code,
      RPCI_ORIENTATIVE_TEXT: 'TEST',
      SOURCE_LOCATION: 'TEST ' + index
    },
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'ITEM_' + index }
  }));

  drts.forEach((drt, index) => records.push({
    record_id: 'DRT_' + index,
    entity_id: drt.entityId,
    parent_record_id: null,
    source_document: 'DRT_' + index,
    attributes: drt.attributes,
    provenance: { sourceKind: 'TEST_ONLY', sourceReference: 'DRT_' + index }
  }));

  const rde = {
    schema_version: '0.2.0',
    process_id: 'TEST_ONLY_PROCESS',
    source: {
      file_id: 'TEST_ONLY_FILE',
      file_name: 'TEST_ONLY.pdf',
      mime_type: 'application/pdf',
      source_url: 'TEST_ONLY_URL',
      sha256: '0'.repeat(64)
    },
    extraction: {
      provider: 'TEST_ONLY',
      extractor_version: 'TEST_ONLY',
      created_at: '2026-10-08T12:00:00.000Z'
    },
    records,
    extraction_warnings: []
  };
  return rde;
}

function makeRde(codes = [], drts = []) {
  const rde = buildRde(codes, drts);
  return api.parseAndValidateOperationalRdeJson_(JSON.stringify(rde), {
    processId: rde.process_id, sourceFileId: rde.source.file_id
  }, contract.entityCatalog);
}

function prepare(codes = [], drts = []) {
  const rde = makeRde(codes, drts);
  const view = api.projectRdeToExecutionView_(rde, contract.entityCatalog);
  const resolution = api.resolveCbmscApplicability(view, currentContext(), contract);
  const plan = api.materializeFrozenExecutionPlan(contract, resolution, view);
  return { rde, view, resolution, plan };
}

for (const entityId of ['ART', 'RRT', 'TRT']) {
  const declarationRde = buildRde([], [{
    entityId,
    attributes: { RESPONSIBILITY_TYPE: 'EXECUCAO' }
  }]);
  declarationRde.schema_version = '0.4.0';
  declarationRde.documentary_associations = [];
  declarationRde.drt_declaration_items = [{
    declaration_id: 'DECL_' + entityId,
    drt_record_id: 'DRT_0',
    activity_service_text: 'execução',
    smsci_scope_text: 'sistema de hidrantes',
    source_document: 'DRT_0',
    source_text: 'Atividade: execução; sistema: sistema de hidrantes.'
  }];
  const authenticatedDeclarationRde = api.parseAndValidateOperationalRdeJson_(
    JSON.stringify(declarationRde), { processId: declarationRde.process_id,
      sourceFileId: declarationRde.source.file_id }, contract.entityCatalog
  );
  const declarationView = api.projectRdeToExecutionView_(
    authenticatedDeclarationRde, contract.entityCatalog
  );
  const declarationRef = new api.TypedReference('DOCUMENT', 'DRT_0');
  const items = declarationView.drtDeclarationItems(declarationRef);
  assert.equal(items.length, 1, entityId);
  assert.equal(items[0].drt.kind, 'DOCUMENT', entityId);
  assert.equal(items[0].sourceDocument.identifier, 'DRT_0', entityId);
  assert.equal(Object.isFrozen(items), true, entityId);
}

const base = prepare([], [
  {
    entityId: 'ART',
    attributes: {
      RESPONSIBILITY_TYPE: 'EXECUCAO',
      COUNCIL_STATE: 'SC',
      COUNCIL_REGISTRATION_STATUS: 'registrada'
    }
  },
  { entityId: 'RRT', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' } },
  { entityId: 'TRT', attributes: { RESPONSIBILITY_TYPE: 'EXECUCAO' } }
]);
const domain = api.resolvedRequiredTechnicalResponsibilities(contract, base.plan, base.view);
assert.equal(Object.isFrozen(domain), true);
assert.equal(domain[0].catalogIdentifier, 'RT-002');
assert.equal(domain[0].responsibilityId, 'RT_002_EXECUCAO_DE_OBRA');
assert.equal(domain[0].documentaryResponsibilityType, 'EXECUCAO');
assert.deepEqual(JSON.parse(JSON.stringify(domain[0].requirementIds)), [
  'REQ_T1_DRT_REQUIRED',
  'REQ_T1_DRT_ACTIVITY_EXECUTION',
  'REQ_T1_CONFORMITY_REPORT',
  'REQ_T1_CONFORMITY_REPORT_SIGNED'
]);
assert.equal(domain.some(item => item.catalogIdentifier === 'RT-003'), false);

const binding = api.materializeResponsibilityEvidenceBinding(
  contract, base.plan, base.view, 'RT-002'
);
assert.equal(Object.isFrozen(binding), true);
assert.equal(Object.isFrozen(binding.evidence), true);
assert.equal(binding.evidence.length, 2);
assert.deepEqual(JSON.parse(JSON.stringify(binding.evidence.map(item => item.entityId))), ['ART', 'TRT']);
assert.deepEqual(JSON.parse(JSON.stringify(binding.evidence.map(item => item.selectionFact.value))), ['EXECUCAO', 'EXECUCAO']);
assert.equal(binding.evidence.every(item => item.reference.kind === 'DOCUMENT'), true);
assert.equal(binding.evidence.every(item => item.sourceDocument.kind === 'DOCUMENT'), true);
assert.equal(api.isCanonicalResponsibilityEvidenceBinding(
  binding, contract, base.plan, base.view
), true);

for (const helperName of [
  'executionReferenceKey',
  'copyImmutableExecutionReference',
  'hasNativeExecutionNonJsonBrand',
  'isPlainExecutionObject',
  'immutableExecutionCopy',
  'assertStrictExecutionJsonValue'
]) {
  assert.throws(
    () => vm.runInContext(helperName, context),
    /not defined/,
    helperName
  );
}

const sourcePreservationRde = makeRde([], [{
  entityId: 'ART',
  attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
let sourcePreservationView;
try {
  vm.runInContext(`
    globalThis.executionReferenceKey = function () { return 'FORGED_KEY'; };
    globalThis.copyImmutableExecutionReference = function () {
      throw new Error('forged reference copy must not run');
    };
    globalThis.hasNativeExecutionNonJsonBrand = function () { return false; };
    globalThis.isPlainExecutionObject = function () { return true; };
    globalThis.assertStrictExecutionJsonValue = function () {};
    globalThis.immutableExecutionCopy = function (value) {
      if (value && typeof value === 'object' &&
          value.RESPONSIBILITY_TYPE === 'VISTORIA_ENSAIO') {
        return Object.freeze({ RESPONSIBILITY_TYPE: 'EXECUCAO' });
      }
      return value;
    };
  `, context);

  sourcePreservationView = api.projectRdeToExecutionView_(
    sourcePreservationRde, contract.entityCatalog
  );
} finally {
  vm.runInContext(`
    delete globalThis.executionReferenceKey;
    delete globalThis.copyImmutableExecutionReference;
    delete globalThis.hasNativeExecutionNonJsonBrand;
    delete globalThis.isPlainExecutionObject;
    delete globalThis.assertStrictExecutionJsonValue;
    delete globalThis.immutableExecutionCopy;
  `, context);
}

  const forgedProjectionEntries = [];
  for (const entityId of Object.keys(contract.entityCatalog)) {
    for (const reference of sourcePreservationView.referencesByEntity(entityId)) {
      const parent = sourcePreservationView.parent(reference);
      const sourceDocument = sourcePreservationView.sourceDocument(reference);
      const entry = {
        reference: new api.TypedReference(reference.kind, reference.identifier),
        entityId,
        parent: parent ? new api.TypedReference(parent.kind, parent.identifier) : null,
        sourceDocument: new api.TypedReference(sourceDocument.kind, sourceDocument.identifier),
        value: JSON.parse(JSON.stringify(sourcePreservationView.read(reference)))
      };
      const provenance = sourcePreservationView.provenance(reference);
      if (provenance !== undefined) entry.provenance = JSON.parse(JSON.stringify(provenance));
      forgedProjectionEntries.push(entry);
    }
  }
  forgedProjectionEntries.find(entry => entry.entityId === 'ART').value.RESPONSIBILITY_TYPE =
    'EXECUCAO';
  assert.throws(
    () => new (vm.runInContext('ImmutableExecutionView', context))(
      forgedProjectionEntries, [], '0.2.0'
    ),
    /only be created from an RDE projection/
  );

  const sourcePreservationSnapshot = snapshotDescriptor.value(
    sourcePreservationView, 'ART'
  );
  assert.equal(sourcePreservationSnapshot.length, 1);
  assert.equal(
    sourcePreservationSnapshot[0].value.RESPONSIBILITY_TYPE,
    'VISTORIA_ENSAIO'
  );

  const sourcePreservationResolution = api.resolveCbmscApplicability(
    sourcePreservationView, currentContext(), contract
  );
  const sourcePreservationPlan = api.materializeFrozenExecutionPlan(
    contract, sourcePreservationResolution, sourcePreservationView
  );
  const sourcePreservationBinding = api.materializeResponsibilityEvidenceBinding(
    contract, sourcePreservationPlan, sourcePreservationView, 'RT-002'
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(sourcePreservationBinding.evidence)),
    []
  );
  assert.equal(
    api.isCanonicalResponsibilityEvidenceBinding(
      sourcePreservationBinding,
      contract,
      sourcePreservationPlan,
      sourcePreservationView
    ),
    true
  );
function assertNoRt002ForRde(rde, attackName) {
  const view = api.projectRdeToExecutionView_(rde, contract.entityCatalog);
  const snapshot = snapshotDescriptor.value(view, 'ART');
  assert.equal(snapshot.length, 1, attackName);
  assert.equal(snapshot[0].value.RESPONSIBILITY_TYPE, 'VISTORIA_ENSAIO', attackName);
  const resolution = api.resolveCbmscApplicability(view, currentContext(), contract);
  const plan = api.materializeFrozenExecutionPlan(contract, resolution, view);
  const result = api.materializeResponsibilityEvidenceBinding(
    contract, plan, view, 'RT-002'
  );
  assert.deepEqual(JSON.parse(JSON.stringify(result.evidence)), [], attackName);
  assert.equal(api.isCanonicalResponsibilityEvidenceBinding(result, contract, plan, view), true);
}

const descriptorAttackRde = makeRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
const nativeGetOwnPropertyDescriptor = vm.runInContext(
  'Object.getOwnPropertyDescriptor', context
);
context.__descriptorAttackRde = descriptorAttackRde;
context.__nativeGetOwnPropertyDescriptor = nativeGetOwnPropertyDescriptor;
try {
  vm.runInContext(`
    const artIndex = __descriptorAttackRde.records.findIndex(record => record.entity_id === 'ART');
    Object.getOwnPropertyDescriptor = function (object, key) {
      if (object === __descriptorAttackRde.records && key === String(artIndex)) {
        const record = __nativeGetOwnPropertyDescriptor(object, key).value;
        return {
          value: { ...record, attributes: { RESPONSIBILITY_TYPE: 'EXECUCAO' } },
          writable: true, enumerable: true, configurable: true
        };
      }
      return __nativeGetOwnPropertyDescriptor(object, key);
    };
  `, context);
  assertNoRt002ForRde(descriptorAttackRde, 'patched Object.getOwnPropertyDescriptor');
} finally {
  vm.runInContext('Object.getOwnPropertyDescriptor = __nativeGetOwnPropertyDescriptor;', context);
  delete context.__descriptorAttackRde;
  delete context.__nativeGetOwnPropertyDescriptor;
}

const pushAttackRde = makeRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
context.__pushAttackRde = pushAttackRde;
vm.runInContext('globalThis.__nativeArrayPush = Array.prototype.push;', context);
try {
  vm.runInContext(`
    const nativePush = Array.prototype.push;
    Array.prototype.push = function (entry) {
      if (entry && entry.entityId === 'ART' && entry.value) {
        entry.value.RESPONSIBILITY_TYPE = 'EXECUCAO';
      }
      return nativePush.apply(this, arguments);
    };
  `, context);
  assertNoRt002ForRde(pushAttackRde, 'patched Array.prototype.push');
} finally {
  vm.runInContext('Array.prototype.push = __nativeArrayPush;', context);
  delete context.__pushAttackRde;
  delete context.__nativeArrayPush;
}

const freezeAttackRde = makeRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
context.__nativeObjectFreeze = vm.runInContext('Object.freeze', context);
try {
  vm.runInContext('Object.freeze = function (value) { return value; };', context);
  const freezeAttackView = api.projectRdeToExecutionView_(
    freezeAttackRde, contract.entityCatalog
  );
  const artReference = freezeAttackView.referencesByEntity('ART')[0];
  assert.equal(Object.isFrozen(artReference), true);
  assert.equal(Reflect.set(artReference, 'identifier', 'FORGED_DOCUMENT'), false);
  assert.equal(freezeAttackView.referencesByEntity('ART')[0].identifier, 'DRT_0');
} finally {
  vm.runInContext('Object.freeze = __nativeObjectFreeze;', context);
  delete context.__nativeObjectFreeze;
}
assertNoRt002ForRde(freezeAttackRde, 'patched Object.freeze');

const prototypeMutationRawRde = buildRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
context.__prototypeMutationRawRde = prototypeMutationRawRde;
context.__nativeForEach = vm.runInContext('Array.prototype.forEach', context);
let prototypeMutationValidatedRde;
try {
  vm.runInContext(`
    const nativeForEach = __nativeForEach;
    Array.prototype.forEach = function (callback, receiver) {
      for (let index = 0; index < this.length; index += 1) {
        const record = this[index];
        if (record && record.entity_id === 'ART') {
          record.attributes.RESPONSIBILITY_TYPE = 'EXECUCAO';
        }
      }
      return Reflect.apply(nativeForEach, this, [callback, receiver]);
    };
  `, context);
  prototypeMutationValidatedRde = api.parseAndValidateOperationalRdeJson_(
    JSON.stringify(prototypeMutationRawRde), {
      processId: prototypeMutationRawRde.process_id,
      sourceFileId: prototypeMutationRawRde.source.file_id
    }, contract.entityCatalog
  );
} finally {
  vm.runInContext('Array.prototype.forEach = __nativeForEach;', context);
  delete context.__prototypeMutationRawRde;
  delete context.__nativeForEach;
}
assert.equal(
  prototypeMutationValidatedRde.records.find(record => record.entity_id === 'ART')
    .attributes.RESPONSIBILITY_TYPE,
  'VISTORIA_ENSAIO'
);
assertNoRt002ForRde(prototypeMutationValidatedRde, 'Array.prototype.forEach mutation before RDE validation');

const applicabilityMapRde = makeRde(['IGC']);
const applicabilityMapView = api.projectRdeToExecutionView_(
  applicabilityMapRde, contract.entityCatalog
);
context.__officialTargetArray = contract.officialEsciTargets;
context.__nativeArrayMap = vm.runInContext('Array.prototype.map', context);
let applicabilityMapResolution;
try {
  vm.runInContext(`
    const planAttackNativeMap = __nativeArrayMap;
    Array.prototype.map = function (callback, receiver) {
      const result = Reflect.apply(planAttackNativeMap, this, [callback, receiver]);
      if (this === __officialTargetArray) {
        const gasDecision = result.find(item => item.target === 'SMSCI_GAS');
        const ielDecision = result.find(item => item.target === 'SMSCI_IEL');
        ielDecision.decision = 'POSITIVE';
        ielDecision.itemReferences = gasDecision.itemReferences;
        ielDecision.itemTraces = gasDecision.itemTraces;
      }
      return result;
    };
  `, context);
  applicabilityMapResolution = api.resolveCbmscApplicability(
    applicabilityMapView, currentContext(), contract
  );
} finally {
  vm.runInContext('Array.prototype.map = __nativeArrayMap;', context);
  delete context.__officialTargetArray;
  delete context.__nativeArrayMap;
}
assert.equal(
  applicabilityMapResolution.officialDecisions.find(item => item.target === 'SMSCI_IEL').decision,
  'NEGATIVE'
);

const applicabilitySpeciesRde = makeRde(['IGC']);
const applicabilitySpeciesView = api.projectRdeToExecutionView_(
  applicabilitySpeciesRde, contract.entityCatalog
);
context.__savedArraySpecies = vm.runInContext(
  'Object.getOwnPropertyDescriptor(Array, Symbol.species)', context
);
context.__nativeReflectDefineProperty = vm.runInContext('Reflect.defineProperty', context);
let applicabilitySpeciesResolution;
try {
  vm.runInContext(`
    Object.defineProperty(Array, Symbol.species, {
      configurable: true,
      value: function () {
        return new Proxy([], {
          defineProperty: function (target, key, descriptor) {
            const decision = descriptor.value;
            if (decision && decision.target === 'SMSCI_IEL') {
              let sourceDecision;
              for (let index = 0; index < target.length; index += 1) {
                if (target[index] && target[index].decision === 'POSITIVE') {
                  sourceDecision = target[index];
                  break;
                }
              }
              if (sourceDecision) {
                decision.decision = 'POSITIVE';
                decision.itemReferences = sourceDecision.itemReferences;
                decision.itemTraces = sourceDecision.itemTraces;
              }
            }
            return Reflect.apply(__nativeReflectDefineProperty, Reflect,
              [target, key, descriptor]);
          }
        });
      }
    });
  `, context);
  applicabilitySpeciesResolution = api.resolveCbmscApplicability(
    applicabilitySpeciesView, currentContext(), contract
  );
} finally {
  vm.runInContext(`
    Object.defineProperty(Array, Symbol.species, __savedArraySpecies);
    delete globalThis.__savedArraySpecies;
    delete globalThis.__nativeReflectDefineProperty;
  `, context);
}
assert.equal(
  applicabilitySpeciesResolution.officialDecisions.find(item => item.target === 'SMSCI_IEL').decision,
  'NEGATIVE'
);

const planMapRde = makeRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
const planMapView = api.projectRdeToExecutionView_(planMapRde, contract.entityCatalog);
const planMapResolution = api.resolveCbmscApplicability(
  planMapView, currentContext(), contract
);
context.__nativeArrayMap = vm.runInContext('Array.prototype.map', context);
let planMapPlan;
try {
  vm.runInContext(`
    const requirementPlanAttackMap = __nativeArrayMap;
    Array.prototype.map = function (callback, receiver) {
      const result = Reflect.apply(requirementPlanAttackMap, this, [callback, receiver]);
      for (let index = 0; index < result.length; index += 1) {
        const requirement = result[index];
        if (!requirement || !Array.isArray(requirement.responsibilityMappings)) continue;
        for (let mappingIndex = 0; mappingIndex < requirement.responsibilityMappings.length;
            mappingIndex += 1) {
          const mapping = requirement.responsibilityMappings[mappingIndex];
          if (mapping.catalogIdentifier === 'RT-002') {
            mapping.documentaryResponsibilityType = 'VISTORIA_ENSAIO';
          }
        }
      }
      return result;
    };
  `, context);
  planMapPlan = api.materializeFrozenExecutionPlan(contract, planMapResolution, planMapView);
} finally {
  vm.runInContext('Array.prototype.map = __nativeArrayMap;', context);
  delete context.__nativeArrayMap;
}
const planMapBinding = api.materializeResponsibilityEvidenceBinding(
  contract, planMapPlan, planMapView, 'RT-002'
);
assert.equal(
  planMapBinding.responsibility.documentaryResponsibilityType,
  'EXECUCAO'
);
assert.deepEqual(JSON.parse(JSON.stringify(planMapBinding.evidence)), []);

const planSpeciesRde = makeRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
const planSpeciesView = api.projectRdeToExecutionView_(planSpeciesRde, contract.entityCatalog);
const planSpeciesResolution = api.resolveCbmscApplicability(
  planSpeciesView, currentContext(), contract
);
context.__savedArraySpecies = vm.runInContext(
  'Object.getOwnPropertyDescriptor(Array, Symbol.species)', context
);
context.__nativeReflectDefineProperty = vm.runInContext('Reflect.defineProperty', context);
let planSpeciesPlan;
try {
  vm.runInContext(`
    Object.defineProperty(Array, Symbol.species, {
      configurable: true,
      value: function () {
        return new Proxy([], {
          defineProperty: function (target, key, descriptor) {
            const requirement = descriptor.value;
            if (requirement && Array.isArray(requirement.responsibilityMappings)) {
              for (let index = 0; index < requirement.responsibilityMappings.length; index += 1) {
                const mapping = requirement.responsibilityMappings[index];
                if (mapping.catalogIdentifier === 'RT-002') {
                  mapping.documentaryResponsibilityType = 'VISTORIA_ENSAIO';
                }
              }
            }
            return Reflect.apply(__nativeReflectDefineProperty, Reflect,
              [target, key, descriptor]);
          }
        });
      }
    });
  `, context);
  planSpeciesPlan = api.materializeFrozenExecutionPlan(
    contract, planSpeciesResolution, planSpeciesView
  );
} finally {
  vm.runInContext(`
    Object.defineProperty(Array, Symbol.species, __savedArraySpecies);
    delete globalThis.__savedArraySpecies;
    delete globalThis.__nativeReflectDefineProperty;
  `, context);
}
const planSpeciesBinding = api.materializeResponsibilityEvidenceBinding(
  contract, planSpeciesPlan, planSpeciesView, 'RT-002'
);
assert.equal(planSpeciesBinding.responsibility.documentaryResponsibilityType, 'EXECUCAO');
assert.deepEqual(JSON.parse(JSON.stringify(planSpeciesBinding.evidence)), []);

const iteratorPoisonRde = makeRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
const iteratorPoisonView = api.projectRdeToExecutionView_(iteratorPoisonRde, contract.entityCatalog);
const iteratorPoisonResolution = api.resolveCbmscApplicability(
  iteratorPoisonView, currentContext(), contract
);
context.__nativeArrayIterator = vm.runInContext('Array.prototype[Symbol.iterator]', context);
let iteratorPoisonPlan;
try {
  vm.runInContext(`
    const canonicalRequirementArray = COMPILED_RUNTIME_CONTRACT.requirements;
    const forgedApplicableRequirement = JSON.parse(JSON.stringify(
      canonicalRequirementArray.find(item => item.responsibilityMappings &&
        item.responsibilityMappings.some(mapping => mapping.catalogIdentifier === 'RT-002'))
    ));
    forgedApplicableRequirement.responsibilityMappings.forEach(mapping => {
      if (mapping.catalogIdentifier === 'RT-002') {
        mapping.documentaryResponsibilityType = 'VISTORIA_ENSAIO';
      }
    });
    const iteratorPayload = [forgedApplicableRequirement];
    Array.prototype[Symbol.iterator] = function () {
      if (this === canonicalRequirementArray) {
        return Reflect.apply(__nativeArrayIterator, iteratorPayload, []);
      }
      return Reflect.apply(__nativeArrayIterator, this, []);
    };
  `, context);
  iteratorPoisonPlan = api.materializeFrozenExecutionPlan(
    contract, iteratorPoisonResolution, iteratorPoisonView
  );
} finally {
  vm.runInContext('Array.prototype[Symbol.iterator] = __nativeArrayIterator;', context);
  delete context.__nativeArrayIterator;
}
const iteratorPoisonBinding = api.materializeResponsibilityEvidenceBinding(
  contract, iteratorPoisonPlan, iteratorPoisonView, 'RT-002'
);
assert.equal(
  iteratorPoisonBinding.responsibility.documentaryResponsibilityType,
  'EXECUCAO'
);
assert.deepEqual(JSON.parse(JSON.stringify(iteratorPoisonBinding.evidence)), []);

const planPushRde = makeRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
const planPushView = api.projectRdeToExecutionView_(planPushRde, contract.entityCatalog);
const planPushResolution = api.resolveCbmscApplicability(
  planPushView, currentContext(), contract
);
context.__nativeArrayPush = vm.runInContext('Array.prototype.push', context);
let planPushPlan;
try {
  vm.runInContext(`
    Array.prototype.push = function () { return this.length; };
  `, context);
  planPushPlan = api.materializeFrozenExecutionPlan(
    contract, planPushResolution, planPushView
  );
} finally {
  vm.runInContext('Array.prototype.push = __nativeArrayPush;', context);
  delete context.__nativeArrayPush;
}
assert.ok(planPushPlan.APPLICABLE_REQUIREMENTS.length > 0);
assert.ok(planPushPlan.PLANNED_EXECUTION_UNITS.length > 0);
assert.equal(api.isCanonicalFrozenExecutionPlan(planPushPlan, contract, planPushView), true);

const prototypePoisonRde = makeRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
const prototypePoisonView = api.projectRdeToExecutionView_(prototypePoisonRde, contract.entityCatalog);
const prototypePoisonResolution = api.resolveCbmscApplicability(
  prototypePoisonView, currentContext(), contract
);
context.__savedMappingSetter = vm.runInContext(
  "Object.getOwnPropertyDescriptor(Object.prototype, 'documentaryResponsibilityType')",
  context
);
let prototypePoisonPlan;
try {
  vm.runInContext(`
    Object.defineProperty(Object.prototype, 'documentaryResponsibilityType', {
      configurable: true,
      set: function () {
        Object.defineProperty(this, 'documentaryResponsibilityType', {
          value: 'VISTORIA_ENSAIO', enumerable: true, writable: true, configurable: true
        });
      }
    });
  `, context);
  prototypePoisonPlan = api.materializeFrozenExecutionPlan(
    contract, prototypePoisonResolution, prototypePoisonView
  );
} finally {
  vm.runInContext(`
    if (__savedMappingSetter) {
      Object.defineProperty(Object.prototype, 'documentaryResponsibilityType', __savedMappingSetter);
    } else {
      delete Object.prototype.documentaryResponsibilityType;
    }
    delete globalThis.__savedMappingSetter;
  `, context);
}
const prototypePoisonMapping = prototypePoisonPlan.APPLICABLE_REQUIREMENTS
  .flatMap(requirement => requirement.responsibilityMappings || [])
  .find(mapping => mapping.catalogIdentifier === 'RT-002');
assert.equal(prototypePoisonMapping.documentaryResponsibilityType, 'EXECUCAO');
const prototypePoisonBinding = api.materializeResponsibilityEvidenceBinding(
  contract, prototypePoisonPlan, prototypePoisonView, 'RT-002'
);
assert.deepEqual(JSON.parse(JSON.stringify(prototypePoisonBinding.evidence)), []);
assert.equal(api.isCanonicalFrozenExecutionPlan(
  prototypePoisonPlan, contract, prototypePoisonView
), true);

const inconsistentProxyRde = makeRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
const inconsistentProxyRecord = inconsistentProxyRde.records.find(record => record.entity_id === 'ART');
const inconsistentProxyAttributes = inconsistentProxyRecord.attributes;
let consistentProxyTrapCalls = 0;
const coherentProxyRde = new Proxy(inconsistentProxyRde, {
  get(target, key, receiver) {
    consistentProxyTrapCalls += 1;
    if (key === 'records') return [{ ...target.records.find(record => record.entity_id === 'ART'),
      attributes: { RESPONSIBILITY_TYPE: 'EXECUCAO' } }];
    return Reflect.get(target, key, receiver);
  },
  getOwnPropertyDescriptor(target, key) {
    consistentProxyTrapCalls += 1;
    const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
    if (key === 'records') {
      return { ...descriptor, value: [{ ...target.records.find(record => record.entity_id === 'ART'),
        attributes: { RESPONSIBILITY_TYPE: 'EXECUCAO' } }] };
    }
    return descriptor;
  }
});
assert.equal(api.isCanonicalValidatedExecutionRde_(inconsistentProxyRde), true);
assert.equal(api.isCanonicalValidatedExecutionRde_(coherentProxyRde), false);
assert.equal(Object.isFrozen(inconsistentProxyRde), true);
const untrustedNestedProxyRde = buildRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
const untrustedNestedProxyTarget = untrustedNestedProxyRde.records.find(
  record => record.entity_id === 'ART'
).attributes;
let nestedProxyTrapCalls = 0;
const untrustedNestedProxy = new Proxy(untrustedNestedProxyTarget, {
  get(target, key, receiver) {
    nestedProxyTrapCalls += 1;
    return key === 'RESPONSIBILITY_TYPE' ? 'EXECUCAO' : Reflect.get(target, key, receiver);
  },
  getOwnPropertyDescriptor(target, key) {
    nestedProxyTrapCalls += 1;
    const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
    return key === 'RESPONSIBILITY_TYPE'
      ? { ...descriptor, value: 'EXECUCAO' } : descriptor;
  }
});
untrustedNestedProxyRde.records.find(record => record.entity_id === 'ART').attributes =
  untrustedNestedProxy;
assert.equal(api.isCanonicalValidatedExecutionRde_(untrustedNestedProxyRde), false);
assert.throws(() => api.projectRdeToExecutionView_(
  untrustedNestedProxyRde, contract.entityCatalog
), /parsed from JSON/);
assert.equal(nestedProxyTrapCalls, 0);
assert.equal(untrustedNestedProxyTarget.RESPONSIBILITY_TYPE, 'VISTORIA_ENSAIO');
assert.throws(
  () => api.projectRdeToExecutionView_(coherentProxyRde, contract.entityCatalog),
  /parsed from JSON/
);
assert.equal(consistentProxyTrapCalls, 0);
assert.equal(inconsistentProxyAttributes.RESPONSIBILITY_TYPE, 'VISTORIA_ENSAIO');

const rdeDefinitionHelperDescriptor = vm.runInContext(
  "Object.getOwnPropertyDescriptor(globalThis, 'rdeEntityDefinition_')",
  context
);
assert.equal(rdeDefinitionHelperDescriptor.writable, false);
assert.equal(rdeDefinitionHelperDescriptor.configurable, false);
assert.throws(() => vm.runInContext(`
  'use strict';
  rdeEntityDefinition_ = function () { return { TYPE: 'DOCUMENT', ABSTRACT: false }; };
`, context), /read only|assign/i);
assert.throws(
  () => makeRde([], [{ entityId: 'DRT', attributes: { RESPONSIBILITY_TYPE: 'EXECUCAO' } }]),
  error => error && error.code === 'RDE_ABSTRACT_ENTITY'
);

const forgedCatalog = vm.runInContext(
  'JSON.parse(JSON.stringify(COMPILED_RUNTIME_CONTRACT.entityCatalog))', context
);
forgedCatalog.PPCI.TYPE = 'FORGED_DOCUMENT_TYPE';
const forgedCatalogRde = makeRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'EXECUCAO' }
}]);
const forgedCatalogView = api.projectRdeToExecutionView_(forgedCatalogRde, forgedCatalog);
assert.throws(
  () => api.resolveCbmscApplicability(forgedCatalogView, currentContext(), contract),
  error => error && /canonical contract entity catalog/.test(error.message)
);

const unabstractedDrtCatalog = vm.runInContext(
  'JSON.parse(JSON.stringify(COMPILED_RUNTIME_CONTRACT.entityCatalog))', context
);
unabstractedDrtCatalog.DRT.ABSTRACT = false;
const unabstractedDrtRde = buildRde([], [{
  entityId: 'DRT', attributes: { RESPONSIBILITY_TYPE: 'EXECUCAO' }
}]);
assert.throws(() => {
  const validated = api.parseAndValidateOperationalRdeJson_(
    JSON.stringify(unabstractedDrtRde), {
      processId: unabstractedDrtRde.process_id,
      sourceFileId: unabstractedDrtRde.source.file_id
    }, unabstractedDrtCatalog
  );
  return api.projectRdeToExecutionView_(validated, unabstractedDrtCatalog);
});

const hiddenAttributeRde = buildRde([], [{ entityId: 'ART', attributes: {
    RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO', UNDECLARED_TEST_FACT: 'TEST_ONLY'
  } }]);
context.__nativeObjectKeys = vm.runInContext('Object.keys', context);
context.__nativeObjectNames = vm.runInContext('Object.getOwnPropertyNames', context);
try {
  vm.runInContext(`
    Object.keys = function (value) {
      const keys = __nativeObjectKeys(value);
      return keys.indexOf('UNDECLARED_TEST_FACT') !== -1
        ? keys.filter(key => key !== 'UNDECLARED_TEST_FACT')
        : keys;
    };
    Object.getOwnPropertyNames = function (value) {
      const names = __nativeObjectNames(value);
      return names.indexOf('UNDECLARED_TEST_FACT') !== -1
        ? names.filter(key => key !== 'UNDECLARED_TEST_FACT')
        : names;
    };
  `, context);
  assert.throws(
    () => api.projectRdeToExecutionView_(hiddenAttributeRde, contract.entityCatalog),
    /parsed from JSON/
  );
} finally {
  vm.runInContext(`
    Object.keys = __nativeObjectKeys;
    Object.getOwnPropertyNames = __nativeObjectNames;
  `, context);
  delete context.__nativeObjectKeys;
  delete context.__nativeObjectNames;
}

const fakeCanonicalBinding = vm.runInContext(`Object.freeze({
  responsibility: Object.freeze({
    responsibilityId: 'RT_002_EXECUCAO_DE_OBRA',
    catalogIdentifier: 'RT-002',
    documentaryResponsibilityType: 'EXECUCAO',
    requirementIds: Object.freeze(['REQ_T1_DRT_REQUIRED'])
  }),
  evidence: Object.freeze([Object.freeze({
    entityId: 'ART',
    reference: Object.freeze({ kind: 'DOCUMENT', identifier: 'DRT_0' }),
    sourceDocument: Object.freeze({ kind: 'DOCUMENT', identifier: 'DRT_0' }),
    provenance: null,
    selectionFact: Object.freeze({ attribute: 'RESPONSIBILITY_TYPE', value: 'EXECUCAO' })
  })])
})`, context);
const fakeCanonicalPlan = vm.runInContext(
  'Object.freeze({ PLANNED_EXECUTION_UNITS: Object.freeze([]) })', context
);
const fakeCanonicalResolution = vm.runInContext(`Object.freeze({
  selectedComprovante: Object.freeze({ kind: 'DOCUMENT', identifier: 'DOC_CURRENT' }),
  officialDecisions: Object.freeze([]),
  derivedDecisions: Object.freeze([])
})`, context);
const forgedCanonicalContract = vm.runInContext(`(() => {
  const clone = JSON.parse(JSON.stringify(COMPILED_RUNTIME_CONTRACT));
  for (let requirementIndex = 0; requirementIndex < clone.requirements.length;
      requirementIndex += 1) {
    const mappings = clone.requirements[requirementIndex].responsibilityMappings || [];
    for (let mappingIndex = 0; mappingIndex < mappings.length; mappingIndex += 1) {
      if (mappings[mappingIndex].catalogIdentifier === 'RT-002') {
        mappings[mappingIndex].documentaryResponsibilityType = 'VISTORIA_ENSAIO';
      }
    }
  }
  return clone;
})()`, context);
context.__fakeCanonicalBinding = fakeCanonicalBinding;
context.__fakeCanonicalPlan = fakeCanonicalPlan;
context.__fakeCanonicalResolution = fakeCanonicalResolution;
context.__forgedCanonicalContract = forgedCanonicalContract;
context.__canonicalContract = contract;
context.__canonicalPlan = base.plan;
context.__canonicalResolution = base.resolution;
context.__canonicalView = base.view;
context.__nativeWeakMapGet = vm.runInContext('WeakMap.prototype.get', context);
try {
  vm.runInContext(`
    WeakMap.prototype.get = function (key) {
      if (key === __fakeCanonicalBinding) {
        return { contract: __canonicalContract, plan: __canonicalPlan, view: __canonicalView };
      }
      if (key === __fakeCanonicalPlan) {
        return {
          contract: __canonicalContract,
          resolution: __canonicalResolution,
          view: __canonicalView
        };
      }
      if (key === __fakeCanonicalResolution) {
        return { contract: __canonicalContract, view: __canonicalView };
      }
      return __nativeWeakMapGet.call(this, key);
    };
  `, context);
  assert.equal(api.isCanonicalResponsibilityEvidenceBinding(
    fakeCanonicalBinding, contract, base.plan, base.view
  ), false);
  assert.equal(api.isCanonicalFrozenExecutionPlan(
    fakeCanonicalPlan, contract, base.view
  ), false);
  assert.equal(api.isCanonicalCbmscApplicabilityResolution(
    fakeCanonicalResolution, base.view, contract
  ), false);
} finally {
  vm.runInContext('WeakMap.prototype.get = __nativeWeakMapGet;', context);
  delete context.__fakeCanonicalBinding;
  delete context.__fakeCanonicalPlan;
  delete context.__fakeCanonicalResolution;
  delete context.__canonicalContract;
  delete context.__canonicalPlan;
  delete context.__canonicalResolution;
  delete context.__canonicalView;
  delete context.__nativeWeakMapGet;
}

const forgedContractRde = makeRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' }
}]);
const forgedContractView = api.projectRdeToExecutionView_(
  forgedContractRde, forgedCanonicalContract.entityCatalog
);
context.__forgedCanonicalContract = forgedCanonicalContract;
context.__nativeWeakSetHas = vm.runInContext('WeakSet.prototype.has', context);
try {
  vm.runInContext(`
    WeakSet.prototype.has = function (candidate) {
      return candidate === __forgedCanonicalContract ||
        Reflect.apply(__nativeWeakSetHas, this, [candidate]);
    };
  `, context);
  assert.equal(api.isCanonicalCompiledRuntimeContract(forgedCanonicalContract), false);
  assert.throws(() => {
    const forgedResolution = api.resolveCbmscApplicability(
      forgedContractView, currentContext(), forgedCanonicalContract
    );
    const forgedPlan = api.materializeFrozenExecutionPlan(
      forgedCanonicalContract, forgedResolution, forgedContractView
    );
    return api.materializeResponsibilityEvidenceBinding(
      forgedCanonicalContract, forgedPlan, forgedContractView, 'RT-002'
    );
  });
} finally {
  vm.runInContext('WeakSet.prototype.has = __nativeWeakSetHas;', context);
  delete context.__forgedCanonicalContract;
  delete context.__nativeWeakSetHas;
}

const weakMapSetAttackRde = makeRde([], [{
  entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'EXECUCAO' }
}]);
let weakMapSetView;
let weakMapSetPlan;
let weakMapSetBinding;
context.__nativeWeakMapSet = vm.runInContext('WeakMap.prototype.set', context);
try {
  vm.runInContext(`
    WeakMap.prototype.set = function () {
      throw new Error('mutable WeakMap.prototype.set must not be consulted');
    };
  `, context);
  weakMapSetView = api.projectRdeToExecutionView_(
    weakMapSetAttackRde, contract.entityCatalog
  );
  const weakMapSetResolution = api.resolveCbmscApplicability(
    weakMapSetView, currentContext(), contract
  );
  weakMapSetPlan = api.materializeFrozenExecutionPlan(
    contract, weakMapSetResolution, weakMapSetView
  );
  weakMapSetBinding = api.materializeResponsibilityEvidenceBinding(
    contract, weakMapSetPlan, weakMapSetView, 'RT-002'
  );
} finally {
  vm.runInContext('WeakMap.prototype.set = __nativeWeakMapSet;', context);
  delete context.__nativeWeakMapSet;
}
assert.equal(api.isCanonicalResponsibilityEvidenceBinding(
  weakMapSetBinding, contract, weakMapSetPlan, weakMapSetView
), true);
assert.equal(weakMapSetBinding.evidence.length, 1);

const originalWeakMapGet = vm.runInContext('WeakMap.prototype.get', context);
context.__originalWeakMapGet = originalWeakMapGet;
try {
  vm.runInContext(`
    WeakMap.prototype.get = function () {
      throw new Error('forged WeakMap.prototype.get must not be consulted');
    };
  `, context);
  const snapshotWithForgedWeakMapPrototype = snapshotDescriptor.value(base.view, 'ART');
  assert.equal(snapshotWithForgedWeakMapPrototype.length, 1);
  assert.equal(snapshotWithForgedWeakMapPrototype[0].entityId, 'ART');
} finally {
  vm.runInContext('WeakMap.prototype.get = __originalWeakMapGet', context);
  delete context.__originalWeakMapGet;
}

const missing = prepare([], [
  { entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'VISTORIA_ENSAIO' } }
]);
const missingBinding = api.materializeResponsibilityEvidenceBinding(
  contract, missing.plan, missing.view, 'RT-002'
);
assert.deepEqual(JSON.parse(JSON.stringify(missingBinding.evidence)), []);
assert.equal('result' in missingBinding, false);
assert.equal('engineResult' in missingBinding, false);
assert.equal('pipelineResult' in missingBinding, false);
assert.equal(api.resolvedRequiredTechnicalResponsibilities(
  contract, missing.plan, missing.view
).some(item => item.catalogIdentifier === 'RT-003'), false);

const pressurization = prepare(['SPDE']);
const pressDomain = api.resolvedRequiredTechnicalResponsibilities(
  contract, pressurization.plan, pressurization.view
);
assert.equal(pressDomain.some(item => item.catalogIdentifier === 'RT-003'), true);
assert.equal(pressDomain.some(item => item.catalogIdentifier === 'RT-005'), true);
assert.equal(pressDomain.some(item => item.catalogIdentifier === 'RT-006'), true);
assert.equal(pressDomain.some(item => item.catalogIdentifier === 'RT-015'), false);

const cmar = prepare(['CMAR']);
const cmarDomain = api.resolvedRequiredTechnicalResponsibilities(
  contract, cmar.plan, cmar.view
);
assert.equal(cmarDomain.some(item => item.catalogIdentifier === 'RT-007'), false);

assert.throws(() => api.materializeResponsibilityEvidenceBinding(
  contract, pressurization.plan, pressurization.view, 'RT-003'
), error => error && error.code === 'RESPONSIBILITY_EVIDENCE_INTEGRITY_ERROR');

const equivalent = prepare([], [
  { entityId: 'ART', attributes: { RESPONSIBILITY_TYPE: 'EXECUCAO' } }
]);
assert.equal(api.isCanonicalResponsibilityEvidenceBinding(
  binding, contract, equivalent.plan, equivalent.view
), false);
const cloned = Object.freeze(JSON.parse(JSON.stringify(binding)));
assert.equal(api.isCanonicalResponsibilityEvidenceBinding(
  cloned, contract, base.plan, base.view
), false);

base.rde.records.find(item => item.record_id === 'DRT_0').attributes.RESPONSIBILITY_TYPE =
  'VISTORIA_ENSAIO';
assert.equal(binding.evidence.length, 2);
assert.deepEqual(JSON.parse(JSON.stringify(binding.evidence.map(item => item.selectionFact.value))), ['EXECUCAO', 'EXECUCAO']);

console.log('apps-script-responsibility-evidence: PASS');
