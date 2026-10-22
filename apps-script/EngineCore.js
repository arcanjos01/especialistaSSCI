/* Núcleo agnóstico do Criterion IR. Sem APIs Apps Script ou dependências externas. */

const ENGINE_ARRAY_IS_ARRAY_ = Array.isArray;
const ENGINE_ARRAY_INCLUDES_ = Array.prototype.includes;
const ENGINE_ARRAY_CONCAT_ = Array.prototype.concat;
const ENGINE_ARRAY_MAP_ = Array.prototype.map;
const ENGINE_ARRAY_SORT_ = Array.prototype.sort;
const ENGINE_REFLECT_APPLY_ = Reflect.apply;
const ENGINE_OBJECT_KEYS_ = Object.keys;
const ENGINE_OBJECT_DEFINE_PROPERTY_ = Object.defineProperty;
const ENGINE_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR_ = Object.getOwnPropertyDescriptor;
const ENGINE_OBJECT_HAS_OWN_PROPERTY_ = Object.prototype.hasOwnProperty;
const ENGINE_OBJECT_TO_STRING_ = Object.prototype.toString;
const ENGINE_OBJECT_GET_PROTOTYPE_OF_ = Object.getPrototypeOf;
const ENGINE_NUMBER_IS_FINITE_ = Number.isFinite;
const ENGINE_NUMBER_IS_INTEGER_ = Number.isInteger;
const ENGINE_STRING_TRIM_ = String.prototype.trim;

const ENGINE_ARRAY_SET_OWN_ = function (array, index, value) {
  ENGINE_REFLECT_APPLY_(ENGINE_OBJECT_DEFINE_PROPERTY_, Object, [array, index, {
    value, enumerable: true, writable: true, configurable: true
  }]);
};

const ENGINE_HAS_OWN_ = function (object, key) {
  return ENGINE_REFLECT_APPLY_(ENGINE_OBJECT_HAS_OWN_PROPERTY_, object, [key]);
};

const ENGINE_OWN_DATA_VALUE_ = function (object, key) {
  if (!object || (typeof object !== 'object' && typeof object !== 'function')) return undefined;
  const descriptor = ENGINE_REFLECT_APPLY_(
    ENGINE_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR_, Object, [object, key]
  );
  return descriptor && ENGINE_HAS_OWN_(descriptor, 'value') ? descriptor.value : undefined;
};

const EngineResult = Object.freeze({
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  UNKNOWN: 'UNKNOWN',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  MANUAL_REVIEW: 'MANUAL_REVIEW'
});

const PipelineResult = Object.freeze({
  PASS: 'PASS',
  FAIL: 'FAIL',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  MANUAL_REVIEW: 'MANUAL_REVIEW'
});

const ArgumentKind = Object.freeze({
  ANY: 'ANY',
  BOOLEAN: 'BOOLEAN',
  NUMBER: 'NUMBER',
  TEXT: 'TEXT',
  REFERENCE: 'REFERENCE',
  COLLECTION: 'COLLECTION'
});

class EngineContractError extends Error {}
class ArgumentContractError extends EngineContractError {}
class PredicateNotFoundError extends EngineContractError {}
class ResultContractError extends EngineContractError {}
class CompositionContractError extends EngineContractError {}

function requireNonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new EngineContractError(label + ' must be a non-empty string');
  }
  return value;
}

function isPlainObject(value) {
  if (!value || ENGINE_REFLECT_APPLY_(ENGINE_OBJECT_TO_STRING_, value, []) !== '[object Object]') return false;
  const prototype = ENGINE_OBJECT_GET_PROTOTYPE_OF_(value);
  return prototype === null || ENGINE_OBJECT_GET_PROTOTYPE_OF_(prototype) === null;
}

const ENGINE_IS_PLAIN_OBJECT_ = isPlainObject;

function engineHasUsableDocumentaryProvenance_(provenance) {
  if (!ENGINE_IS_PLAIN_OBJECT_(provenance)) return false;
  const hasString = key => {
    const value = ENGINE_OWN_DATA_VALUE_(provenance, key);
    return typeof value === 'string' &&
      ENGINE_REFLECT_APPLY_(ENGINE_STRING_TRIM_, value, []).length > 0;
  };
  const hasPositiveInteger = key => {
    const value = ENGINE_OWN_DATA_VALUE_(provenance, key);
    return ENGINE_NUMBER_IS_INTEGER_(value) && value > 0;
  };
  return (hasString('sourceKind') && hasString('sourceReference')) ||
    hasPositiveInteger('page') || hasPositiveInteger('row') ||
    hasPositiveInteger('column') || hasString('text_span') ||
    hasString('location') || hasString('attachment');
}

class TypedReference {
  constructor(kind, identifier) {
    this.kind = requireNonEmptyString(kind, 'reference kind');
    this.identifier = requireNonEmptyString(identifier, 'reference identifier');
    Object.freeze(this);
  }
}

const ENGINE_TYPED_REFERENCE_CLASS_ = TypedReference;

class ArgumentSpec {
  constructor({ name, kind = ArgumentKind.ANY, required = true, many = false }) {
    this.name = requireNonEmptyString(name, 'argument name');
    if (!Object.values(ArgumentKind).includes(kind)) {
      throw new ArgumentContractError('unknown argument kind: ' + kind);
    }
    if (typeof required !== 'boolean' || typeof many !== 'boolean') {
      throw new ArgumentContractError('required and many must be boolean');
    }
    this.kind = kind;
    this.required = required;
    this.many = many;
    Object.freeze(this);
  }
}

function immutableCopy(value, active = []) {
  if (value instanceof TypedReference) return value;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && ENGINE_NUMBER_IS_FINITE_(value)) return value;
  if (ENGINE_ARRAY_IS_ARRAY_(value)) {
    if (ENGINE_REFLECT_APPLY_(ENGINE_ARRAY_INCLUDES_, active, [value])) {
      throw new ArgumentContractError('cyclic argument values are not supported');
    }
    const nextActive = ENGINE_REFLECT_APPLY_(ENGINE_ARRAY_CONCAT_, active, [[value]]);
    const copy = ENGINE_REFLECT_APPLY_(ENGINE_ARRAY_MAP_, value, [
      item => immutableCopy(item, nextActive)
    ]);
    return Object.freeze(copy);
  }
  if (isPlainObject(value)) {
    if (ENGINE_REFLECT_APPLY_(ENGINE_ARRAY_INCLUDES_, active, [value])) {
      throw new ArgumentContractError('cyclic argument values are not supported');
    }
    const nextActive = ENGINE_REFLECT_APPLY_(ENGINE_ARRAY_CONCAT_, active, [value]);
    const copy = {};
    const keys = ENGINE_OBJECT_KEYS_(value);
    ENGINE_REFLECT_APPLY_(ENGINE_ARRAY_SORT_, keys, []);
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      ENGINE_REFLECT_APPLY_(ENGINE_OBJECT_DEFINE_PROPERTY_, Object, [copy, key, {
        value: immutableCopy(value[key], nextActive), enumerable: true,
        writable: false, configurable: false
      }]);
    }
    return Object.freeze(copy);
  }
  throw new ArgumentContractError('argument values must be immutable JSON-like values or TypedReference');
}

class ArgumentSchema {
  constructor(specs = []) {
    if (!Array.isArray(specs) || specs.some(spec => !(spec instanceof ArgumentSpec))) {
      throw new ArgumentContractError('specs must be an array of ArgumentSpec');
    }
    const names = specs.map(spec => spec.name);
    if (new Set(names).size !== names.length) {
      throw new ArgumentContractError('argument names must be unique');
    }
    this.specs = Object.freeze(specs.slice());
    Object.freeze(this);
  }

  validate(argumentsByName) {
    if (!argumentsByName || typeof argumentsByName !== 'object' ||
        Array.isArray(argumentsByName)) {
      throw new ArgumentContractError('arguments must be a named object');
    }
    const keys = Object.keys(argumentsByName);
    const known = new Set(this.specs.map(spec => spec.name));
    const unknown = keys.filter(key => !known.has(key)).sort();
    if (unknown.length) {
      throw new ArgumentContractError('unknown arguments: ' + unknown.join(', '));
    }
    const validated = {};
    this.specs.forEach(spec => {
      if (!ENGINE_HAS_OWN_(argumentsByName, spec.name)) {
        if (spec.required) {
          throw new ArgumentContractError('missing required argument: ' + spec.name);
        }
        return;
      }
      const value = argumentsByName[spec.name];
      const values = spec.many ? value : [value];
      if (spec.many && !Array.isArray(value)) {
        throw new ArgumentContractError('argument ' + spec.name + ' must be a collection');
      }
      values.forEach(item => validateArgumentKind(spec, item));
      ENGINE_REFLECT_APPLY_(ENGINE_OBJECT_DEFINE_PROPERTY_, Object, [validated, spec.name, {
        value: immutableCopy(spec.many ? values : value),
        enumerable: true, writable: false, configurable: false
      }]);
    });
    return Object.freeze(validated);
  }
}

function validateArgumentKind(spec, value) {
  const valid = {
    ANY: true,
    BOOLEAN: typeof value === 'boolean',
    NUMBER: typeof value === 'number' && Number.isFinite(value),
    TEXT: typeof value === 'string',
    REFERENCE: value instanceof TypedReference,
    COLLECTION: Array.isArray(value)
  }[spec.kind];
  if (!valid) {
    throw new ArgumentContractError('argument ' + spec.name + ' is not of type ' + spec.kind);
  }
}

class ResolverContext {
  constructor({ criterionId, requirementId }) {
    this.criterionId = requireNonEmptyString(criterionId, 'criterionId');
    this.requirementId = requireNonEmptyString(requirementId, 'requirementId');
    Object.freeze(this);
  }
}

class PredicateContract {
  constructor({ predicateId, argumentSchema, resultContract, resolver }) {
    this.predicateId = requireNonEmptyString(predicateId, 'predicateId');
    if (!(argumentSchema instanceof ArgumentSchema)) {
      throw new EngineContractError('argumentSchema must be an ArgumentSchema');
    }
    const allowed = Array.isArray(resultContract) ? resultContract.slice() : [];
    if (!allowed.length || allowed.some(result => !Object.values(EngineResult).includes(result))) {
      throw new EngineContractError('resultContract must declare EngineResults');
    }
    if (new Set(allowed).size !== allowed.length) {
      throw new EngineContractError('resultContract values must be unique');
    }
    if (!resolver || typeof resolver.resolve !== 'function') {
      throw new EngineContractError('resolver must implement resolve');
    }
    this.argumentSchema = argumentSchema;
    this.resultContract = Object.freeze(allowed);
    const resolve = resolver.resolve;
    this.resolver = Object.freeze({ resolve: resolve.bind(resolver) });
    Object.freeze(this);
  }

  validateResult(result) {
    if (!this.resultContract.includes(result)) {
      throw new ResultContractError(this.predicateId + ' returned disallowed result ' + result);
    }
  }
}

class PredicateRegistry {
  constructor(contracts = []) {
    if (!Array.isArray(contracts)) throw new EngineContractError('contracts must be an array');
    const entries = Object.create(null);
    contracts.forEach(contract => {
      if (!(contract instanceof PredicateContract)) {
        throw new EngineContractError('registry entries must be PredicateContract');
      }
      if (ENGINE_HAS_OWN_(entries, contract.predicateId)) {
        throw new EngineContractError('duplicate predicateId: ' + contract.predicateId);
      }
      ENGINE_REFLECT_APPLY_(ENGINE_OBJECT_DEFINE_PROPERTY_, Object,
        [entries, contract.predicateId, {
        value: contract, enumerable: true, writable: false, configurable: false
        }]);
    });
    this._contracts = Object.freeze(entries);
    Object.freeze(this);
  }

  resolve(predicateId) {
    if (!ENGINE_HAS_OWN_(this._contracts, predicateId)) {
      throw new PredicateNotFoundError('predicate not found: ' + predicateId);
    }
    return this._contracts[predicateId];
  }
}

// The source-defined TECHNICAL_PRODUCT_ATTRIBUTE behavior currently supports
// only SIGNED.  It consumes an already-bound product reference; entity lookup
// and the mapping to its declared field remain in the execution bridge.
function technicalProductAttributePredicateContract() {
  return new PredicateContract({
    predicateId: 'TECHNICAL_PRODUCT_ATTRIBUTE',
    argumentSchema: new ArgumentSchema([
      new ArgumentSpec({ name: 'technicalProduct', kind: ArgumentKind.REFERENCE }),
      new ArgumentSpec({ name: 'attribute', kind: ArgumentKind.TEXT })
    ]),
    resultContract: [EngineResult.TRUE, EngineResult.MANUAL_REVIEW],
    resolver: {
      resolve(args, memory) {
        if (args.attribute !== 'SIGNED') {
          throw new ArgumentContractError(
            'TECHNICAL_PRODUCT_ATTRIBUTE supports only SIGNED'
          );
        }
        if (args.technicalProduct.kind === 'DOCUMENT_ABSENCE') {
          return { result: EngineResult.MANUAL_REVIEW,
            memoryReferences: [args.technicalProduct] };
        }
        if (typeof memory.read !== 'function') {
          throw new EngineContractError(
            'TECHNICAL_PRODUCT_ATTRIBUTE requires read-only memory.read'
          );
        }
        const attributes = memory.read(args.technicalProduct);
        if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
          throw new ResultContractError(
            'TECHNICAL_PRODUCT_ATTRIBUTE product attributes are invalid'
          );
        }
        return {
          // SIGNATURE_MECHANISM is FACT-ONLY text.  The RDE has no typed fact
          // that proves documentary verifiability, so text presence cannot
          // satisfy SIGNED.
          result: EngineResult.MANUAL_REVIEW,
          memoryReferences: [args.technicalProduct]
        };
      }
    }
  });
}

function authenticateRt002DrtPredicate_(args, memory, context, predicateId) {
  const expected = predicateId === 'RESPONSIBILITY_DRT_ACTIVITY_EXECUTION'
    ? { requirementId: 'REQ_T1_DRT_ACTIVITY_EXECUTION', criterionId: 'T1_DRT_ACTIVITY_EXECUTION' }
    : { requirementId: 'REQ_T1_DRT_REQUIRED', criterionId: 'T1_DRT_REQUIRED' };
  const authenticatedExecution = context &&
    typeof isImmutableExecutionView === 'function' && isImmutableExecutionView(memory) &&
    typeof isCanonicalCompiledRuntimeContract === 'function' &&
      isCanonicalCompiledRuntimeContract(context.compiledContract) &&
    typeof isCanonicalFrozenExecutionPlan === 'function' &&
      isCanonicalFrozenExecutionPlan(context.executionPlan, context.compiledContract, memory) &&
    typeof isCanonicalCurrentSubmissionContext === 'function' &&
      isCanonicalCurrentSubmissionContext(context.currentSubmissionContext) &&
    typeof selectCurrentComprovante === 'function' &&
    context.requirementId === expected.requirementId &&
    context.criterionId === expected.criterionId &&
    Array.isArray(context.executionPlan.PLANNED_EXECUTION_UNITS) &&
    context.executionPlan.PLANNED_EXECUTION_UNITS.some(unit =>
      unit && unit.requirement && unit.requirement.id === expected.requirementId &&
      unit.criterion && unit.criterion.id === expected.criterionId);
  if (!authenticatedExecution) return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
  let selectedPresentation;
  try {
    getAuthenticatedPresentationIdentity(context.currentSubmissionContext);
    selectedPresentation = selectCurrentComprovante(memory, context.currentSubmissionContext);
  } catch (error) {
    return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
  }
  const plannedPresentation = context.executionPlan.selectedComprovante;
  if (!plannedPresentation || plannedPresentation.kind !== 'DOCUMENT' ||
      !(selectedPresentation instanceof ENGINE_TYPED_REFERENCE_CLASS_) ||
      selectedPresentation.kind !== plannedPresentation.kind ||
      selectedPresentation.identifier !== plannedPresentation.identifier) {
    return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
  }
  if (typeof materializeResponsibilityEvidenceBinding !== 'function' ||
      typeof isCanonicalResponsibilityEvidenceBinding !== 'function') {
    return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
  }
  let binding;
  try {
    binding = materializeResponsibilityEvidenceBinding(
      context.compiledContract, context.executionPlan, memory, 'RT-002');
  } catch (error) {
    return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
  }
  if (!isCanonicalResponsibilityEvidenceBinding(binding,
        context.compiledContract, context.executionPlan, memory)) {
    return { result: EngineResult.MANUAL_REVIEW, memoryReferences: args.evidenceReferences.slice() };
  }
  const evidence = binding.evidence || [];
  if (args.evidenceReferences.length !== evidence.length ||
      args.evidenceReferences.some((reference, index) => {
        const expectedReference = evidence[index] && evidence[index].reference;
        return !expectedReference || reference.kind !== expectedReference.kind ||
          reference.identifier !== expectedReference.identifier;
      })) {
    return { result: EngineResult.MANUAL_REVIEW, memoryReferences: args.evidenceReferences.slice() };
  }
  if (predicateId === 'RESPONSIBILITY_DRT_ACTIVITY_EXECUTION') {
    const catalog = context.compiledContract.responsibilityCatalog &&
      context.compiledContract.responsibilityCatalog['RT-002'];
    const literals = catalog && catalog.machineCompatibleActivityLiterals;
    if (!Array.isArray(literals) || literals.length === 0 ||
        args.expectedActivityLiterals.length !== literals.length ||
        args.expectedActivityLiterals.some((literal, index) => literal !== literals[index])) {
      return { result: EngineResult.MANUAL_REVIEW, memoryReferences: args.evidenceReferences.slice() };
    }
  }
  return null;
}

function responsibilityHasAcceptedDrtEvidencePredicateContract() {
  return new PredicateContract({
    predicateId: 'RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE',
    argumentSchema: new ArgumentSchema([
      new ArgumentSpec({ name: 'evidenceReferences', kind: ArgumentKind.REFERENCE, many: true })
    ]),
    resultContract: [EngineResult.TRUE, EngineResult.MANUAL_REVIEW],
    resolver: {
      resolve(args, memory, context) {
        const gate = authenticateRt002DrtPredicate_(args, memory, context,
          'RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE');
        if (gate) return gate;
        if (args.evidenceReferences.length === 0) {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
        }
        if (!memory || typeof memory.contains !== 'function' ||
            typeof memory.read !== 'function') {
          throw new EngineContractError(
            'RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE requires read-only Process Memory'
          );
        }
        for (let index = 0; index < args.evidenceReferences.length; index += 1) {
          const reference = args.evidenceReferences[index];
          if (!(reference instanceof ENGINE_TYPED_REFERENCE_CLASS_) || reference.kind !== 'DOCUMENT' ||
              !memory.contains(reference)) {
            throw new ResultContractError(
              'RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE reference is not in Process Memory'
            );
          }
          const facts = memory.read(reference);
          if (!facts || typeof facts !== 'object' ||
              facts.RESPONSIBILITY_TYPE !== 'EXECUCAO') {
            throw new ResultContractError(
              'RESPONSIBILITY_HAS_ACCEPTED_DRT_EVIDENCE reference lacks exact EXECUCAO fact'
            );
          }
        }
        return {
          result: EngineResult.TRUE,
          memoryReferences: args.evidenceReferences
        };
      }
    }
  });
}

function responsibilityDrtActivityExecutionPredicateContract() {
  return new PredicateContract({
    predicateId: 'RESPONSIBILITY_DRT_ACTIVITY_EXECUTION',
    argumentSchema: new ArgumentSchema([
      new ArgumentSpec({ name: 'evidenceReferences', kind: ArgumentKind.REFERENCE, many: true }),
      new ArgumentSpec({ name: 'expectedActivityLiterals', kind: ArgumentKind.TEXT, many: true })
    ]),
    resultContract: [EngineResult.TRUE, EngineResult.MANUAL_REVIEW],
    resolver: {
      resolve(args, memory, context) {
        const gate = authenticateRt002DrtPredicate_(args, memory, context,
          'RESPONSIBILITY_DRT_ACTIVITY_EXECUTION');
        if (gate) return gate;
        if (args.evidenceReferences.length === 0) {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: args.evidenceReferences,
            documentaryEvidence: [] };
        }
        if (!memory || typeof memory.contains !== 'function' ||
            typeof memory.drtActivityItems !== 'function') {
          throw new EngineContractError(
            'RESPONSIBILITY_DRT_ACTIVITY_EXECUTION requires read-only Process Memory'
          );
        }
        if (args.expectedActivityLiterals.length === 0) {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: args.evidenceReferences,
            documentaryEvidence: [] };
        }
        for (let literalIndex = 0; literalIndex < args.expectedActivityLiterals.length; literalIndex += 1) {
          if (typeof args.expectedActivityLiterals[literalIndex] !== 'string' ||
              !args.expectedActivityLiterals[literalIndex]) {
            return { result: EngineResult.MANUAL_REVIEW, memoryReferences: args.evidenceReferences,
              documentaryEvidence: [] };
          }
        }
        const documentaryEvidence = [];
        let everyDrtDeclaresExpectedActivity = true;
        for (let index = 0; index < args.evidenceReferences.length; index += 1) {
          const reference = args.evidenceReferences[index];
          if (!(reference instanceof ENGINE_TYPED_REFERENCE_CLASS_) ||
              reference.kind !== 'DOCUMENT' || !memory.contains(reference)) {
            throw new ResultContractError(
              'RESPONSIBILITY_DRT_ACTIVITY_EXECUTION evidence reference is not in Process Memory'
            );
          }
          const items = memory.drtActivityItems(reference);
          if (!ENGINE_ARRAY_IS_ARRAY_(items)) {
            throw new ResultContractError(
              'RESPONSIBILITY_DRT_ACTIVITY_EXECUTION returned an invalid activity collection'
            );
          }
          const itemSnapshots = [];
          for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
            const itemDescriptor = ENGINE_REFLECT_APPLY_(
              ENGINE_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR_, Object,
              [items, itemIndex]
            );
            if (!itemDescriptor || !ENGINE_HAS_OWN_(itemDescriptor, 'value')) {
              throw new ResultContractError(
                'RESPONSIBILITY_DRT_ACTIVITY_EXECUTION activity collection must contain own data items'
              );
            }
            const item = itemDescriptor.value;
            const sourceDocument = ENGINE_OWN_DATA_VALUE_(item, 'sourceDocument');
            const activityItemId = ENGINE_OWN_DATA_VALUE_(item, 'activityItemId');
            const activityServiceText = ENGINE_OWN_DATA_VALUE_(item, 'activityServiceText');
            const sourceText = ENGINE_OWN_DATA_VALUE_(item, 'sourceText');
            if (!item || !(sourceDocument instanceof ENGINE_TYPED_REFERENCE_CLASS_) ||
                sourceDocument.kind !== 'DOCUMENT' || typeof activityItemId !== 'string' ||
                typeof activityServiceText !== 'string' || typeof sourceText !== 'string') {
              throw new ResultContractError(
                'RESPONSIBILITY_DRT_ACTIVITY_EXECUTION returned an invalid activity item'
              );
            }
            const rawItemProvenance = ENGINE_OWN_DATA_VALUE_(item, 'provenance');
            const itemProvenance = rawItemProvenance === undefined ? null : rawItemProvenance;
            const sourceProvenance = typeof memory.provenance === 'function'
              ? memory.provenance(sourceDocument) : null;
            ENGINE_ARRAY_SET_OWN_(itemSnapshots, itemIndex, {
              activityItemId,
              drt: reference,
              activityServiceText,
              sourceDocument,
              sourceText,
              itemProvenance,
              sourceProvenance: sourceProvenance === undefined ? null : sourceProvenance
            });
          }
          ENGINE_ARRAY_SET_OWN_(documentaryEvidence, index, {
            drt: reference, activityItems: itemSnapshots
          });
          let thisDrtDeclaresExpectedActivity = false;
          for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
            const item = itemSnapshots[itemIndex];
            let matchesCatalogLiteral = false;
            for (let literalIndex = 0; literalIndex < args.expectedActivityLiterals.length; literalIndex += 1) {
              if (item && item.activityServiceText === args.expectedActivityLiterals[literalIndex]) {
                matchesCatalogLiteral = true;
              }
            }
            if (matchesCatalogLiteral && item.itemProvenance !== null &&
                item.sourceProvenance !== null && item.sourceProvenance !== undefined) {
              thisDrtDeclaresExpectedActivity = true;
            }
          }
          if (items.length === 0 || !thisDrtDeclaresExpectedActivity) {
            everyDrtDeclaresExpectedActivity = false;
          }
        }
        return { result: everyDrtDeclaresExpectedActivity ? EngineResult.TRUE : EngineResult.MANUAL_REVIEW,
          memoryReferences: args.evidenceReferences,
          documentaryEvidence };
      }
    }
  });
}

function authenticateBasicDrtAttributeDisclosure_(args, memory, context) {
  const empty = { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
  const attributesByCriterion = {
    T1_DRT_RI_LEGAL_ENTITY: ['RI_NAME'],
    T1_DRT_RT_NAME: ['RT_NAME'],
    T1_DRT_ADDRESS: ['PROPERTY_ADDRESS_TEXT'],
    T1_DRT_AREA: ['PROPERTY_AREA_TEXT'],
    T1_DRT_REGISTERED: [
      'COUNCIL_REGISTRATION_STATUS', 'COUNCIL_ISSUANCE_STATUS', 'COUNCIL_PAYMENT_STATUS'
    ],
    T4_DRT_REGISTERED: [
      'COUNCIL_REGISTRATION_STATUS', 'COUNCIL_ISSUANCE_STATUS', 'COUNCIL_PAYMENT_STATUS'
    ],
    T1_DRT_SIGNED: ['SIGNATURE_PARTY', 'SIGNATURE_MECHANISM'],
    T4_DRT_SIGNED: ['SIGNATURE_PARTY', 'SIGNATURE_MECHANISM']
  };
  if (!context ||
      (context.requirementId !== 'REQ_T1_DRT_BASIC_DATA' &&
       context.requirementId !== 'REQ_T1_DRT_REGISTERED' &&
       context.requirementId !== 'REQ_T1_DRT_SIGNED') ||
      !ENGINE_HAS_OWN_(attributesByCriterion, context.criterionId) ||
      (context.role !== 'ASSERT' && context.role !== 'VALIDATE') ||
      typeof isImmutableExecutionView !== 'function' || !isImmutableExecutionView(memory) ||
      typeof isCanonicalCompiledRuntimeContract !== 'function' ||
      !isCanonicalCompiledRuntimeContract(context.compiledContract) ||
      typeof isCanonicalFrozenExecutionPlan !== 'function' ||
      !isCanonicalFrozenExecutionPlan(context.executionPlan, context.compiledContract, memory) ||
      typeof isCanonicalCurrentSubmissionContext !== 'function' ||
      !isCanonicalCurrentSubmissionContext(context.currentSubmissionContext)) return empty;
  const isBasicData = context.requirementId === 'REQ_T1_DRT_BASIC_DATA';
  const isRegistration = context.requirementId === 'REQ_T1_DRT_REGISTERED';
  const isSignature = context.requirementId === 'REQ_T1_DRT_SIGNED';
  if ((isBasicData && !ENGINE_HAS_OWN_(
    { T1_DRT_RI_LEGAL_ENTITY: true, T1_DRT_RT_NAME: true,
      T1_DRT_ADDRESS: true, T1_DRT_AREA: true }, context.criterionId)) ||
      (isRegistration && context.criterionId !== 'T1_DRT_REGISTERED' &&
        context.criterionId !== 'T4_DRT_REGISTERED') ||
      (isSignature && context.criterionId !== 'T1_DRT_SIGNED' &&
        context.criterionId !== 'T4_DRT_SIGNED')) return empty;
  const allowedAttributes = ENGINE_OWN_DATA_VALUE_(attributesByCriterion, context.criterionId);
  let attributeAllowed = false;
  for (let index = 0; index < allowedAttributes.length; index += 1) {
    if (ENGINE_OWN_DATA_VALUE_(allowedAttributes, String(index)) === args.attribute) {
      attributeAllowed = true;
    }
  }
  if (context.role === 'ASSERT' && !attributeAllowed) return empty;
  if (context.role === 'VALIDATE' && (!isBasicData || args.attribute !== 'RI_NAME')) return empty;
  let plannedUnitFound = false;
  const units = context.executionPlan.PLANNED_EXECUTION_UNITS;
  for (let index = 0; index < units.length; index += 1) {
    const unit = ENGINE_OWN_DATA_VALUE_(units, String(index));
    const requirement = ENGINE_OWN_DATA_VALUE_(unit, 'requirement');
    const criterion = ENGINE_OWN_DATA_VALUE_(unit, 'criterion');
    if (ENGINE_OWN_DATA_VALUE_(requirement, 'id') === context.requirementId &&
        ENGINE_OWN_DATA_VALUE_(criterion, 'id') === context.criterionId) plannedUnitFound = true;
  }
  if (!plannedUnitFound) return empty;
  let currentPresentation;
  try {
    getAuthenticatedPresentationIdentity(context.currentSubmissionContext);
    currentPresentation = selectCurrentComprovante(memory, context.currentSubmissionContext);
  } catch (error) {
    return empty;
  }
  const plannedPresentation = context.executionPlan.selectedComprovante;
  if (!currentPresentation || !plannedPresentation ||
      currentPresentation.kind !== plannedPresentation.kind ||
      currentPresentation.identifier !== plannedPresentation.identifier) return empty;
  let expectedReferences = [];
  try {
    for (const entityId of ['ART', 'RRT', 'TRT']) {
      const references = memory.referencesByEntity(entityId);
      if (!ENGINE_ARRAY_IS_ARRAY_(references)) return empty;
      expectedReferences = ENGINE_REFLECT_APPLY_(ENGINE_ARRAY_CONCAT_, expectedReferences, [references]);
    }
  } catch (error) {
    return empty;
  }
  if (!ENGINE_ARRAY_IS_ARRAY_(args.evidenceReferences) ||
      args.evidenceReferences.length !== expectedReferences.length) return empty;
  for (let index = 0; index < expectedReferences.length; index += 1) {
    const expected = ENGINE_OWN_DATA_VALUE_(expectedReferences, String(index));
    const actual = ENGINE_OWN_DATA_VALUE_(args.evidenceReferences, String(index));
    if (!expected || !actual || expected.kind !== actual.kind ||
        expected.identifier !== actual.identifier) return empty;
  }
  return null;
}

function responsibilityDrtAttributeDisclosurePredicateContract() {
  return new PredicateContract({
    predicateId: 'RESPONSIBILITY_DRT_ATTRIBUTE_DISCLOSURE',
    argumentSchema: new ArgumentSchema([
      new ArgumentSpec({ name: 'evidenceReferences', kind: ArgumentKind.REFERENCE, many: true }),
      new ArgumentSpec({ name: 'attribute', kind: ArgumentKind.TEXT })
    ]),
    resultContract: [EngineResult.MANUAL_REVIEW],
    resolver: {
      resolve(args, memory, context) {
        const gate = authenticateBasicDrtAttributeDisclosure_(args, memory, context);
        if (gate) return gate;
        if (!memory || typeof memory.contains !== 'function' ||
            typeof memory.read !== 'function' || typeof memory.sourceDocument !== 'function' ||
            typeof memory.entityId !== 'function' || typeof memory.provenance !== 'function') {
          throw new EngineContractError(
            'RESPONSIBILITY_DRT_ATTRIBUTE_DISCLOSURE requires read-only Process Memory'
          );
        }
        const documentaryEvidence = [];
        for (let index = 0; index < args.evidenceReferences.length; index += 1) {
          const reference = args.evidenceReferences[index];
          if (!(reference instanceof ENGINE_TYPED_REFERENCE_CLASS_) ||
              reference.kind !== 'DOCUMENT' || !memory.contains(reference)) {
            throw new ResultContractError(
              'RESPONSIBILITY_DRT_ATTRIBUTE_DISCLOSURE evidence reference is not in Process Memory'
            );
          }
          const entityId = memory.entityId(reference);
          if (entityId !== 'ART' && entityId !== 'RRT' && entityId !== 'TRT') {
            throw new ResultContractError(
              'RESPONSIBILITY_DRT_ATTRIBUTE_DISCLOSURE accepts only ART, RRT or TRT evidence'
            );
          }
          const sourceDocument = memory.sourceDocument(reference);
          const facts = memory.read(reference);
          const value = ENGINE_OWN_DATA_VALUE_(facts, args.attribute);
          const provenance = memory.provenance(reference);
          const provenanceUsable = engineHasUsableDocumentaryProvenance_(provenance);
          const literalUsable = typeof value === 'string' && value.trim().length > 0;
          const sourceDocumentMatches = sourceDocument instanceof ENGINE_TYPED_REFERENCE_CLASS_ &&
            sourceDocument.kind === 'DOCUMENT' && sourceDocument.identifier === reference.identifier;
          documentaryEvidence.push({
            document: reference,
            documentEntityId: entityId,
            attribute: args.attribute,
            literal: value === undefined ? null : value,
            sourceDocument,
            provenance: provenance === undefined ? null : provenance,
            provenanceSufficient: !!provenanceUsable,
            disclosureSufficient: !!(literalUsable && provenanceUsable && sourceDocumentMatches),
            associationStatus: 'UNASSOCIATED_WITH_REQUIRED_RESPONSIBILITY'
          });
        }
        return {
          result: EngineResult.MANUAL_REVIEW,
          memoryReferences: args.evidenceReferences,
          documentaryEvidence
        };
      }
    }
  });
}

function authenticateRt007FinalVerificationPredicate_(args, memory, context) {
  const authenticatedExecution = context &&
    typeof isImmutableExecutionView === 'function' && isImmutableExecutionView(memory) &&
    typeof isCanonicalCompiledRuntimeContract === 'function' &&
      isCanonicalCompiledRuntimeContract(context.compiledContract) &&
    typeof isCanonicalFrozenExecutionPlan === 'function' &&
      isCanonicalFrozenExecutionPlan(context.executionPlan, context.compiledContract, memory) &&
    typeof isCanonicalCurrentSubmissionContext === 'function' &&
      isCanonicalCurrentSubmissionContext(context.currentSubmissionContext) &&
    typeof selectCurrentComprovante === 'function' &&
    context.requirementId === 'REQ_IN19_FINAL_VERIFICATION' &&
    context.criterionId === 'T4_IN19_FINAL_VERIFICATION' &&
    ENGINE_ARRAY_IS_ARRAY_(context.executionPlan.PLANNED_EXECUTION_UNITS);
  if (!authenticatedExecution) return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
  let plannedUnitFound = false;
  for (let index = 0; index < context.executionPlan.PLANNED_EXECUTION_UNITS.length; index += 1) {
    const unit = ENGINE_OWN_DATA_VALUE_(context.executionPlan.PLANNED_EXECUTION_UNITS, String(index));
    const requirement = ENGINE_OWN_DATA_VALUE_(unit, 'requirement');
    const criterion = ENGINE_OWN_DATA_VALUE_(unit, 'criterion');
    if (ENGINE_OWN_DATA_VALUE_(requirement, 'id') === context.requirementId &&
        ENGINE_OWN_DATA_VALUE_(criterion, 'id') === context.criterionId) plannedUnitFound = true;
  }
  if (!plannedUnitFound) return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
  let selectedPresentation;
  try {
    getAuthenticatedPresentationIdentity(context.currentSubmissionContext);
    selectedPresentation = selectCurrentComprovante(memory, context.currentSubmissionContext);
  } catch (error) {
    return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
  }
  const plannedPresentation = ENGINE_OWN_DATA_VALUE_(context.executionPlan, 'selectedComprovante');
  if (!plannedPresentation || !selectedPresentation ||
      selectedPresentation.kind !== plannedPresentation.kind ||
      selectedPresentation.identifier !== plannedPresentation.identifier) {
    return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
  }
  let domain;
  let expectedReferences;
  try {
    domain = resolvedRequiredTechnicalResponsibilities(context.compiledContract,
      context.executionPlan, memory);
    expectedReferences = memory.referencesByEntity('LOW_VOLTAGE_FINAL_VERIFICATION_DRT');
  } catch (error) {
    return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
  }
  let mappingCount = 0;
  for (let index = 0; index < domain.length; index += 1) {
    const item = domain[index];
    const requirementIds = item && item.requirementIds;
    let hasRequirement = false;
    if (ENGINE_ARRAY_IS_ARRAY_(requirementIds)) {
      for (let requirementIndex = 0; requirementIndex < requirementIds.length; requirementIndex += 1) {
        if (requirementIds[requirementIndex] === 'REQ_IN19_FINAL_VERIFICATION') hasRequirement = true;
      }
    }
    if (item && item.catalogIdentifier === 'RT-007' &&
        item.responsibilityId === 'RT_007_AVALIACAO_TECNICA' && hasRequirement) mappingCount += 1;
  }
  const responsibilityCatalog = ENGINE_OWN_DATA_VALUE_(context.compiledContract, 'responsibilityCatalog');
  const catalog = ENGINE_OWN_DATA_VALUE_(responsibilityCatalog, 'RT-007');
  const literals = ENGINE_OWN_DATA_VALUE_(catalog, 'machineCompatibleActivityLiterals');
  let referencesMatch = ENGINE_ARRAY_IS_ARRAY_(expectedReferences) &&
    ENGINE_ARRAY_IS_ARRAY_(args.evidenceReferences) && args.evidenceReferences.length === expectedReferences.length;
  if (referencesMatch) {
    for (let index = 0; index < expectedReferences.length; index += 1) {
      const expected = ENGINE_OWN_DATA_VALUE_(expectedReferences, String(index));
      const reference = ENGINE_OWN_DATA_VALUE_(args.evidenceReferences, String(index));
      if (!expected || !reference ||
          ENGINE_OWN_DATA_VALUE_(reference, 'kind') !== ENGINE_OWN_DATA_VALUE_(expected, 'kind') ||
          ENGINE_OWN_DATA_VALUE_(reference, 'identifier') !== ENGINE_OWN_DATA_VALUE_(expected, 'identifier') ||
          ENGINE_OWN_DATA_VALUE_(reference, 'kind') !== 'DRT') referencesMatch = false;
    }
  }
  const literalsMatch = ENGINE_ARRAY_IS_ARRAY_(literals) && literals.length === 1 &&
    ENGINE_ARRAY_IS_ARRAY_(args.expectedActivityLiterals) && args.expectedActivityLiterals.length === literals.length &&
    ENGINE_OWN_DATA_VALUE_(args.expectedActivityLiterals, '0') === literals[0] &&
    literals[0] === 'verificação final da instalação elétrica de baixa tensão';
  if (mappingCount !== 1 || !referencesMatch || !literalsMatch) {
    const memoryReferences = [];
    if (ENGINE_ARRAY_IS_ARRAY_(args.evidenceReferences)) {
      for (let index = 0; index < args.evidenceReferences.length; index += 1) {
        ENGINE_ARRAY_SET_OWN_(memoryReferences, memoryReferences.length,
          ENGINE_OWN_DATA_VALUE_(args.evidenceReferences, String(index)));
      }
    }
    return { result: EngineResult.MANUAL_REVIEW, memoryReferences };
  }
  return null;
}

function responsibilityDrtActivityFinalVerificationPredicateContract() {
  return new PredicateContract({
    predicateId: 'RESPONSIBILITY_DRT_ACTIVITY_FINAL_VERIFICATION',
    argumentSchema: new ArgumentSchema([
      new ArgumentSpec({ name: 'evidenceReferences', kind: ArgumentKind.REFERENCE, many: true }),
      new ArgumentSpec({ name: 'expectedActivityLiterals', kind: ArgumentKind.TEXT, many: true })
    ]),
    resultContract: [EngineResult.TRUE, EngineResult.MANUAL_REVIEW],
    resolver: {
      resolve(args, memory, context) {
        const gate = authenticateRt007FinalVerificationPredicate_(args, memory, context);
        if (gate) return gate;
        if (args.evidenceReferences.length === 0) {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [], documentaryEvidence: [] };
        }
        if (typeof memory.sourceDocument !== 'function' ||
            typeof memory.entityId !== 'function' || typeof memory.drtActivityItems !== 'function' ||
            typeof memory.provenance !== 'function') {
          return { result: EngineResult.MANUAL_REVIEW,
            memoryReferences: copyEvidenceReferences(), documentaryEvidence: [] };
        }
        const memoryReferences = [];
        const documentaryEvidence = [];
        let everyDeclarationVerified = true;
        const copyEvidenceReferences = function () {
          const copy = [];
          for (let copyIndex = 0; copyIndex < args.evidenceReferences.length; copyIndex += 1) {
            ENGINE_ARRAY_SET_OWN_(copy, copy.length,
              ENGINE_OWN_DATA_VALUE_(args.evidenceReferences, String(copyIndex)));
          }
          return copy;
        };
        for (let index = 0; index < args.evidenceReferences.length; index += 1) {
          const drt = args.evidenceReferences[index];
          if (!(drt instanceof ENGINE_TYPED_REFERENCE_CLASS_) || drt.kind !== 'DRT' ||
              !memory.contains(drt)) {
            return { result: EngineResult.MANUAL_REVIEW,
              memoryReferences: copyEvidenceReferences(), documentaryEvidence: [] };
          }
          const sourceDocument = memory.sourceDocument(drt);
          if (!(sourceDocument instanceof ENGINE_TYPED_REFERENCE_CLASS_) ||
              sourceDocument.kind !== 'DOCUMENT' || !memory.contains(sourceDocument) ||
          !ENGINE_REFLECT_APPLY_(ENGINE_ARRAY_INCLUDES_, ['ART', 'RRT', 'TRT'],
            [memory.entityId(sourceDocument)])) {
            everyDeclarationVerified = false;
            ENGINE_ARRAY_SET_OWN_(memoryReferences, memoryReferences.length, drt);
            documentaryEvidence[index] = { finalVerificationDrt: drt,
              reason: 'CONCRETE_DRT_SOURCE_UNAVAILABLE' };
            continue;
          }
          let activities;
          try {
            activities = memory.drtActivityItems(sourceDocument);
          } catch (error) {
            activities = [];
          }
          if (!ENGINE_ARRAY_IS_ARRAY_(activities)) {
            return { result: EngineResult.MANUAL_REVIEW,
              memoryReferences: copyEvidenceReferences(), documentaryEvidence: [] };
          }
          const itemSnapshots = [];
          let matched = false;
          const rawSourceProvenance = memory.provenance(sourceDocument);
          const rawRoleProvenance = memory.provenance(drt);
          const sourceProvenance = rawSourceProvenance === undefined || rawSourceProvenance === null
            ? null : rawSourceProvenance;
          const roleProvenance = rawRoleProvenance === undefined || rawRoleProvenance === null
            ? null : rawRoleProvenance;
          for (let itemIndex = 0; itemIndex < activities.length; itemIndex += 1) {
            const item = activities[itemIndex];
            const itemProvenance = ENGINE_OWN_DATA_VALUE_(item, 'provenance');
            const activityServiceText = ENGINE_OWN_DATA_VALUE_(item, 'activityServiceText');
            const activityItemId = ENGINE_OWN_DATA_VALUE_(item, 'activityItemId');
            const itemSourceDocument = ENGINE_OWN_DATA_VALUE_(item, 'sourceDocument');
            const sourceText = ENGINE_OWN_DATA_VALUE_(item, 'sourceText');
            const matchesLiteral = activityServiceText === args.expectedActivityLiterals[0] &&
              itemSourceDocument instanceof ENGINE_TYPED_REFERENCE_CLASS_ &&
              itemSourceDocument.kind === sourceDocument.kind &&
              itemSourceDocument.identifier === sourceDocument.identifier;
            ENGINE_ARRAY_SET_OWN_(itemSnapshots, itemIndex, {
              activityItemId,
              activityServiceText,
              sourceDocument: itemSourceDocument,
              sourceText,
              itemProvenance: itemProvenance === undefined ? null : itemProvenance,
              sourceProvenance: sourceProvenance === undefined ? null : sourceProvenance
            });
            if (matchesLiteral && itemProvenance !== undefined && itemProvenance !== null &&
                rawSourceProvenance !== undefined && rawSourceProvenance !== null &&
                rawRoleProvenance !== undefined && rawRoleProvenance !== null) matched = true;
          }
          ENGINE_ARRAY_SET_OWN_(memoryReferences, memoryReferences.length, drt);
          ENGINE_ARRAY_SET_OWN_(memoryReferences, memoryReferences.length, sourceDocument);
          ENGINE_ARRAY_SET_OWN_(documentaryEvidence, index, {
            finalVerificationDrt: drt, sourceDocument,
            roleProvenance, sourceProvenance, activities: itemSnapshots
          });
          if (!matched) everyDeclarationVerified = false;
        }
        return { result: everyDeclarationVerified ? EngineResult.TRUE : EngineResult.MANUAL_REVIEW,
          memoryReferences, documentaryEvidence };
      }
    }
  });
}

function responsibilityIsSatisfiedForSmsciPredicateContract() {
  return new PredicateContract({
    predicateId: 'RESPONSIBILITY_IS_SATISFIED_FOR_SMSCI',
    argumentSchema: new ArgumentSchema([
      new ArgumentSpec({ name: 'evidenceReferences', kind: ArgumentKind.REFERENCE, many: true }),
      new ArgumentSpec({ name: 'expectedSmsciCode', kind: ArgumentKind.TEXT }),
      new ArgumentSpec({ name: 'expectedActivityLiteral', kind: ArgumentKind.TEXT })
    ]),
    resultContract: [EngineResult.TRUE, EngineResult.MANUAL_REVIEW],
    resolver: {
      resolve(args, memory, context) {
        const authenticatedExecution = context &&
          typeof isImmutableExecutionView === 'function' &&
          isImmutableExecutionView(memory) &&
          typeof isCanonicalCompiledRuntimeContract === 'function' &&
          isCanonicalCompiledRuntimeContract(context.compiledContract) &&
          typeof isCanonicalFrozenExecutionPlan === 'function' &&
          isCanonicalFrozenExecutionPlan(context.executionPlan, context.compiledContract, memory) &&
          typeof isCanonicalCurrentSubmissionContext === 'function' &&
          isCanonicalCurrentSubmissionContext(context.currentSubmissionContext) &&
          typeof selectCurrentComprovante === 'function';
        if (!authenticatedExecution) {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
        }
        let selectedPresentation;
        try {
          selectedPresentation = selectCurrentComprovante(memory,
            context.currentSubmissionContext);
        } catch (error) {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
        }
        const plannedPresentation = context.executionPlan.selectedComprovante;
        if (!plannedPresentation || plannedPresentation.kind !== 'DOCUMENT' ||
            typeof plannedPresentation.identifier !== 'string' ||
            !(selectedPresentation instanceof ENGINE_TYPED_REFERENCE_CLASS_) ||
            selectedPresentation.kind !== plannedPresentation.kind ||
            selectedPresentation.identifier !== plannedPresentation.identifier) {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
        }
        if (!context || context.criterionId !== 'T1_DRT_SMSCI_COVERAGE' ||
            context.requirementId !== 'REQ_T1_DRT_SMSCI' ||
            !context.executionPlan || !Array.isArray(context.executionPlan.PLANNED_EXECUTION_UNITS) ||
            !context.compiledContract || !context.compiledContract.entityCatalog ||
            !context.compiledContract.responsibilityCatalog) {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
        }
        const rt003Catalog = context.compiledContract.responsibilityCatalog['RT-003'];
        const catalogActivities = rt003Catalog && rt003Catalog.machineCompatibleActivityLiterals;
        if (!Array.isArray(catalogActivities) || catalogActivities.length !== 1 ||
            args.expectedActivityLiteral !== catalogActivities[0] ||
            !Array.isArray(context.executionPlan.PLANNED_EXECUTION_UNITS) ||
            !context.executionPlan.PLANNED_EXECUTION_UNITS.some(unit =>
            unit && unit.requirement && unit.requirement.id === 'REQ_T1_DRT_SMSCI' &&
              unit.criterion && unit.criterion.id === 'T1_DRT_SMSCI_COVERAGE' &&
              unit.iterationSource === 'WORKLIST.SMSCI' &&
              Array.isArray(unit.plannedBindings) && unit.plannedBindings.some(binding => {
                const entity = context.compiledContract.entityCatalog[binding && binding.target];
                return entity && entity.TYPE === 'SMSCI' &&
                  entity.OFFICIAL_ESCI_CODE === args.expectedSmsciCode;
              }))) {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
        }
        if (!memory || typeof memory.contains !== 'function' ||
            typeof memory.drtScopeDeclarationItems !== 'function') {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
        }
        if (typeof materializeResponsibilityEvidenceBinding !== 'function' ||
            typeof isCanonicalResponsibilityEvidenceBinding !== 'function') {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
        }
        let canonicalBinding;
        try {
          canonicalBinding = materializeResponsibilityEvidenceBinding(
            context.compiledContract, context.executionPlan, memory, 'RT-003');
        } catch (error) {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
        }
        if (!isCanonicalResponsibilityEvidenceBinding(canonicalBinding,
              context.compiledContract, context.executionPlan, memory)) {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
        }
        const canonicalEvidence = canonicalBinding.evidence || [];
        if (args.evidenceReferences.length !== canonicalEvidence.length ||
            args.evidenceReferences.some((reference, index) => {
              const canonicalReference = canonicalEvidence[index] && canonicalEvidence[index].reference;
              return !canonicalReference || reference.kind !== canonicalReference.kind ||
                reference.identifier !== canonicalReference.identifier;
            })) {
          return { result: EngineResult.MANUAL_REVIEW,
            memoryReferences: args.evidenceReferences.slice() };
        }
        const candidates = [];
        const conflictingDeclarations = [];
        let conflictingDeclaration = false;
        const memoryReferences = args.evidenceReferences.slice();
        for (let referenceIndex = 0; referenceIndex < args.evidenceReferences.length; referenceIndex += 1) {
          const drt = args.evidenceReferences[referenceIndex];
          if (!(drt instanceof ENGINE_TYPED_REFERENCE_CLASS_) || drt.kind !== 'DOCUMENT' ||
              !memory.contains(drt)) {
            return { result: EngineResult.MANUAL_REVIEW, memoryReferences };
          }
          const items = memory.drtScopeDeclarationItems(drt);
          if (!ENGINE_ARRAY_IS_ARRAY_(items)) {
            return { result: EngineResult.MANUAL_REVIEW, memoryReferences };
          }
          for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
            const item = items[itemIndex];
            if (!item || !(item.drt instanceof ENGINE_TYPED_REFERENCE_CLASS_) ||
                item.drt.kind !== 'DOCUMENT' || item.drt.identifier !== drt.identifier) continue;
            // Ignore declarations for other SMSCI before contradiction checks.
            if (item.smsciText !== args.expectedSmsciCode) continue;
            if (item.activityServiceText !== args.expectedActivityLiteral ||
                !(item.product instanceof ENGINE_TYPED_REFERENCE_CLASS_) ||
                !(item.sourceDocument instanceof ENGINE_TYPED_REFERENCE_CLASS_) ||
                item.sourceDocument.kind !== 'DOCUMENT' || !memory.contains(item.product) ||
                !memory.contains(item.sourceDocument) ||
                typeof item.drtReferenceText !== 'string' || typeof item.productReferenceText !== 'string' ||
                typeof item.sourceText !== 'string') {
              conflictingDeclaration = true;
              conflictingDeclarations[conflictingDeclarations.length] = item;
              if (item.product instanceof ENGINE_TYPED_REFERENCE_CLASS_) {
                memoryReferences[memoryReferences.length] = item.product;
              }
              if (item.sourceDocument instanceof ENGINE_TYPED_REFERENCE_CLASS_) {
                memoryReferences[memoryReferences.length] = item.sourceDocument;
              }
              continue;
            }
            let drtSourceDocument;
            try {
              drtSourceDocument = typeof memory.sourceDocument === 'function'
                ? memory.sourceDocument(drt) : null;
            } catch (error) {
              drtSourceDocument = null;
            }
            if (!(drtSourceDocument instanceof ENGINE_TYPED_REFERENCE_CLASS_) ||
                item.sourceDocument.kind !== drtSourceDocument.kind ||
                item.sourceDocument.identifier !== drtSourceDocument.identifier) {
              conflictingDeclaration = true;
              conflictingDeclarations[conflictingDeclarations.length] = item;
              memoryReferences[memoryReferences.length] = item.product;
              memoryReferences[memoryReferences.length] = item.sourceDocument;
              continue;
            }
            candidates[candidates.length] = item;
            memoryReferences[memoryReferences.length] = item.product;
            memoryReferences[memoryReferences.length] = item.sourceDocument;
          }
        }
        // Distinct DRTs/products may each make the same exact declaration.
        // Their identities are evidence, not a conflict in the declared scope.
        const signatures = candidates.map(item => JSON.stringify({
          smsci: item.smsciText,
          activity: item.activityServiceText
        }));
        const uniqueSignatures = Array.from(new Set(signatures));
        const result = candidates.length > 0 && uniqueSignatures.length === 1 &&
          !conflictingDeclaration
          ? EngineResult.TRUE : EngineResult.MANUAL_REVIEW;
        return { result, memoryReferences,
          documentaryEvidence: candidates.concat(conflictingDeclarations) };
      }
    }
  });
}

Object.defineProperty(globalThis, 'responsibilityDrtActivityExecutionPredicateContract', {
  value: responsibilityDrtActivityExecutionPredicateContract,
  enumerable: true, writable: false, configurable: false
});
Object.defineProperty(globalThis, 'responsibilityDrtActivityFinalVerificationPredicateContract', {
  value: responsibilityDrtActivityFinalVerificationPredicateContract,
  enumerable: true, writable: false, configurable: false
});
Object.defineProperty(globalThis, 'responsibilityIsSatisfiedForSmsciPredicateContract', {
  value: responsibilityIsSatisfiedForSmsciPredicateContract,
  enumerable: true, writable: false, configurable: false
});

function responsibilityHasTechnicalProductPredicateContract() {
  return new PredicateContract({
    predicateId: 'RESPONSIBILITY_HAS_TECHNICAL_PRODUCT',
    argumentSchema: new ArgumentSchema([
      new ArgumentSpec({ name: 'responsibility', kind: ArgumentKind.TEXT }),
      new ArgumentSpec({ name: 'technicalProduct', kind: ArgumentKind.TEXT })
    ]),
    resultContract: [EngineResult.TRUE, EngineResult.FALSE, EngineResult.MANUAL_REVIEW],
    resolver: {
      resolve(args, memory, context, correlationProjection) {
        if (args.responsibility !== 'RT_002_EXECUCAO_DE_OBRA' ||
            args.technicalProduct !== 'CONFORMITY_REPORT') {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
        }
        if (!context || !context.executionPlan || !context.currentSubmissionContext) {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [],
            documentaryEvidence: { reason: 'CURRENT_PRESENTATION_UNAVAILABLE' } };
        }
        if (typeof materializeResponsibilityEvidenceBinding !== 'function' ||
            typeof isCanonicalResponsibilityEvidenceBinding !== 'function') {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [] };
        }
        const selectedComprovante = context.executionPlan &&
          context.executionPlan.selectedComprovante;
        if (!isPlainObject(selectedComprovante) ||
            Object.keys(selectedComprovante).sort().join(',') !== 'identifier,kind' ||
            selectedComprovante.kind !== 'DOCUMENT' ||
            typeof selectedComprovante.identifier !== 'string' ||
            !selectedComprovante.identifier) {
          throw new ResultContractError(
            'RESPONSIBILITY_HAS_TECHNICAL_PRODUCT requires an exact selectedComprovante snapshot'
          );
        }
        const sourceAnchor = new TypedReference(selectedComprovante.kind,
          selectedComprovante.identifier);
        if (!memory.contains(sourceAnchor) ||
            memory.entityId(sourceAnchor) !== 'COMPROVANTE_DE_SOLICITACAO_DE_HABITESE') {
          throw new ResultContractError(
            'RESPONSIBILITY_HAS_TECHNICAL_PRODUCT selectedComprovante is not an exact memory entity'
          );
        }
        const presentationUnavailable = () => ({
          result: EngineResult.MANUAL_REVIEW,
          memoryReferences: [sourceAnchor],
          documentaryEvidence: { reason: 'CURRENT_PRESENTATION_UNAVAILABLE' }
        });
        let contextPresentation;
        try {
          if (typeof getAuthenticatedPresentationIdentity !== 'function' ||
              typeof selectCurrentComprovante !== 'function') {
            return presentationUnavailable();
          }
          getAuthenticatedPresentationIdentity(context.currentSubmissionContext);
          contextPresentation = selectCurrentComprovante(memory,
            context.currentSubmissionContext);
        } catch (error) {
          return presentationUnavailable();
        }
        if (!(contextPresentation instanceof TypedReference) ||
            contextPresentation.kind !== sourceAnchor.kind ||
            contextPresentation.identifier !== sourceAnchor.identifier) {
          return { result: EngineResult.MANUAL_REVIEW,
            memoryReferences: [sourceAnchor],
            documentaryEvidence: { reason: 'CURRENT_PRESENTATION_MISMATCH' } };
        }
        const bindingUnavailable = () => ({
          result: EngineResult.MANUAL_REVIEW,
          memoryReferences: [sourceAnchor],
          externalRelationTrace: { reason: 'RT_BINDING_UNAVAILABLE' }
        });
        let evidenceBinding;
        try {
          evidenceBinding = materializeResponsibilityEvidenceBinding(
            context.compiledContract, context.executionPlan, memory, 'RT-002');
        } catch (error) {
          return bindingUnavailable();
        }
        const selected = evidenceBinding.evidence || [];
        if (!isCanonicalResponsibilityEvidenceBinding(evidenceBinding,
              context.compiledContract, context.executionPlan, memory) ||
            selected.length !== 1 || !selected[0].reference ||
            selected[0].reference.kind !== 'DOCUMENT') {
          return {
            result: EngineResult.MANUAL_REVIEW,
            memoryReferences: [sourceAnchor, ...selected.map(entry => entry && entry.reference)
              .filter(reference => reference && typeof reference.kind === 'string' &&
                typeof reference.identifier === 'string')
              .map(reference => new TypedReference(reference.kind, reference.identifier))],
            externalRelationTrace: { reason: 'RT_BINDING_UNAVAILABLE' }
          };
        }
        const drt = new TypedReference(selected[0].reference.kind,
          selected[0].reference.identifier);
        const facts = memory.read(drt);
        if (!facts || facts.RESPONSIBILITY_TYPE !== 'EXECUCAO') {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [drt] };
        }
        const productReferences = typeof memory.referencesByEntity === 'function'
          ? memory.referencesByEntity('CONFORMITY_REPORT') : null;
        if (!Array.isArray(productReferences)) {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: [drt] };
        }
        if (productReferences.length === 0) {
          return { result: EngineResult.MANUAL_REVIEW,
            memoryReferences: [drt, sourceAnchor],
            documentaryEvidence: { entityId: 'CONFORMITY_REPORT',
              reason: 'DOCUMENT_INVENTORY_UNAVAILABLE',
              selectedDocument: {
                reference: { kind: sourceAnchor.kind, identifier: sourceAnchor.identifier },
                sourceDocument: (() => {
                  const sourceDocument = memory.sourceDocument(sourceAnchor);
                  return sourceDocument instanceof TypedReference
                    ? { kind: sourceDocument.kind, identifier: sourceDocument.identifier }
                    : null;
                })(),
                provenance: memory.provenance(sourceAnchor) === undefined
                  ? null : memory.provenance(sourceAnchor)
              } } };
        }
        if (productReferences.length !== 1 ||
            !(productReferences[0] instanceof TypedReference) ||
            productReferences[0].kind !== 'REPORT' ||
            memory.entityId(productReferences[0]) !== 'CONFORMITY_REPORT') {
          return { result: EngineResult.MANUAL_REVIEW, memoryReferences: productReferences };
        }
        const product = productReferences[0];
        if (typeof memory.documentaryAssociations === 'function') {
          let associations;
          try {
            associations = memory.documentaryAssociations(drt);
          } catch (error) {
            associations = null;
          }
          if (!ENGINE_ARRAY_IS_ARRAY_(associations)) {
            return { result: EngineResult.MANUAL_REVIEW,
              memoryReferences: [drt, product],
              documentaryEvidence: { reason: 'DOCUMENTARY_ASSOCIATIONS_UNAVAILABLE' } };
          }
          const exactAssociations = [];
          const associationLength = ENGINE_OWN_DATA_VALUE_(associations, 'length');
          for (let index = 0; index < associationLength; index += 1) {
            const association = ENGINE_OWN_DATA_VALUE_(associations, index);
            if (!ENGINE_IS_PLAIN_OBJECT_(association)) continue;
            const left = ENGINE_OWN_DATA_VALUE_(association, 'left');
            const right = ENGINE_OWN_DATA_VALUE_(association, 'right');
            const sourceDocument = ENGINE_OWN_DATA_VALUE_(association, 'sourceDocument');
            const associationId = ENGINE_OWN_DATA_VALUE_(association, 'associationId');
            const statementText = ENGINE_OWN_DATA_VALUE_(association, 'statementText');
            if (!(left instanceof TypedReference) || !(right instanceof TypedReference) ||
                !(sourceDocument instanceof TypedReference) ||
                sourceDocument.kind !== 'DOCUMENT' || !memory.contains(sourceDocument) ||
                typeof associationId !== 'string' || !associationId ||
                typeof statementText !== 'string' || !statementText) continue;
            const matches = (left.kind === drt.kind && left.identifier === drt.identifier &&
                right.kind === product.kind && right.identifier === product.identifier) ||
              (right.kind === drt.kind && right.identifier === drt.identifier &&
                left.kind === product.kind && left.identifier === product.identifier);
            if (matches) ENGINE_ARRAY_SET_OWN_(exactAssociations,
              ENGINE_OWN_DATA_VALUE_(exactAssociations, 'length'), association);
          }
          if (exactAssociations.length > 1) {
            const ambiguousReferences = [drt, product];
            const ambiguousIds = [];
            for (let index = 0; index < ENGINE_OWN_DATA_VALUE_(exactAssociations, 'length'); index += 1) {
              const association = ENGINE_OWN_DATA_VALUE_(exactAssociations, index);
              ENGINE_ARRAY_SET_OWN_(ambiguousReferences,
                ENGINE_OWN_DATA_VALUE_(ambiguousReferences, 'length'),
                ENGINE_OWN_DATA_VALUE_(association, 'sourceDocument'));
              ENGINE_ARRAY_SET_OWN_(ambiguousIds,
                ENGINE_OWN_DATA_VALUE_(ambiguousIds, 'length'),
                ENGINE_OWN_DATA_VALUE_(association, 'associationId'));
            }
            return { result: EngineResult.MANUAL_REVIEW,
              memoryReferences: ambiguousReferences,
              documentaryEvidence: { reason: 'DOCUMENTARY_ASSOCIATION_AMBIGUOUS',
                associationIds: ambiguousIds } };
          }
          if (exactAssociations.length === 1) {
            const association = exactAssociations[0];
            return { result: EngineResult.TRUE,
              memoryReferences: [drt, product, association.sourceDocument],
              documentaryEvidence: {
                associationId: ENGINE_OWN_DATA_VALUE_(association, 'associationId'),
                left: ENGINE_OWN_DATA_VALUE_(association, 'left'),
                right: ENGINE_OWN_DATA_VALUE_(association, 'right'),
                sourceDocument: ENGINE_OWN_DATA_VALUE_(association, 'sourceDocument'),
                statementText: ENGINE_OWN_DATA_VALUE_(association, 'statementText'),
                provenance: ENGINE_OWN_DATA_VALUE_(association, 'provenance') === undefined
                  ? null : ENGINE_OWN_DATA_VALUE_(association, 'provenance')
              } };
          }
        } else {
          return { result: EngineResult.MANUAL_REVIEW,
            memoryReferences: [drt, product],
            documentaryEvidence: { reason: 'DOCUMENTARY_ASSOCIATIONS_UNAVAILABLE' } };
        }
        if (typeof isCanonicalEngineCorrelationProjection !== 'function' ||
            !isCanonicalEngineCorrelationProjection(correlationProjection,
              context.compiledContract, context.executionPlan, memory,
              context.currentSubmissionContext)) {
          return { result: EngineResult.MANUAL_REVIEW,
            memoryReferences: [product],
            externalRelationTrace: { reason: 'CORRELATION_PROJECTION_REJECTED' } };
        }
        const relationTrace = {
          decisionId: correlationProjection.decisionId,
          rdeDigest: correlationProjection.rdeDigest,
          policy: { id: correlationProjection.policyVersion },
          calibration: { id: correlationProjection.calibrationId,
            version: correlationProjection.calibrationVersion },
          status: correlationProjection.status,
          reason: 'CORRELATION_NOT_ADMITTED'
        };
        const manualReview = (references) => ({ result: EngineResult.MANUAL_REVIEW,
          memoryReferences: references,
          externalRelationTrace: relationTrace });
        const relation = correlationProjection.relation;
        if (correlationProjection.status !== 'ADMITTED' || !relation ||
            !relation.drtSource || !relation.technicalProductTarget) {
          return manualReview([productReferences[0]]);
        }
        const correlatedProduct = new TypedReference(relation.technicalProductTarget.kind, relation.technicalProductTarget.identifier);
        if (!memory.contains(drt) || !memory.contains(correlatedProduct) ||
            correlatedProduct.kind !== 'REPORT' || correlatedProduct.identifier === drt.identifier ||
            correlatedProduct.identifier !== product.identifier ||
            memory.entityId(correlatedProduct) !== 'CONFORMITY_REPORT' ||
            drt.identifier !== relation.drtSource.identifier ||
            drt.kind !== relation.drtSource.kind) {
          return manualReview([drt, correlatedProduct]);
        }
        return { result: EngineResult.MANUAL_REVIEW,
          memoryReferences: [drt, correlatedProduct],
          externalRelationTrace: {
            decisionId: correlationProjection.decisionId,
            rdeDigest: correlationProjection.rdeDigest,
            policy: { id: correlationProjection.policyVersion },
            calibration: { id: correlationProjection.calibrationId,
              version: correlationProjection.calibrationVersion },
            status: correlationProjection.status,
            reason: 'ADMITTED_CORRELATION_CONTEXT_ONLY'
          } };
      }
    }
  });
}

class PredicateCall {
  constructor(predicateId, argumentsByName = {}) {
    this.predicateId = requireNonEmptyString(predicateId, 'predicateId');
    this.arguments = immutableCopy(argumentsByName);
    if (!this.arguments || Array.isArray(this.arguments) ||
        !isPlainObject(this.arguments)) {
      throw new ArgumentContractError('predicate arguments must be a named object');
    }
    Object.freeze(this);
  }
}

class Exists {
  constructor(reference) {
    if (!(reference instanceof TypedReference)) {
      throw new ArgumentContractError('EXISTS requires a TypedReference');
    }
    this.reference = reference;
    Object.freeze(this);
  }
}

// The canonical Base currently declares only MANUAL_REVIEW as an ASSERT
// literal. Its process document references are bound by planned execution.
class AssertLiteral {
  constructor(value, documentaryReferences) {
    if (value !== EngineResult.MANUAL_REVIEW) {
      throw new ArgumentContractError('ASSERT literal supports only MANUAL_REVIEW');
    }
    if (!Array.isArray(documentaryReferences) || documentaryReferences.length === 0 ||
        documentaryReferences.some(reference => !(reference instanceof TypedReference)) ||
        !documentaryReferences.some(reference =>
          reference.kind === 'DOCUMENT' || reference.kind === 'DOCUMENT_ABSENCE')) {
      throw new ArgumentContractError('ASSERT literal requires a source document or document absence');
    }
    this.value = value;
    this.documentaryReferences = Object.freeze(documentaryReferences.slice());
    Object.freeze(this);
  }
}

class All {
  constructor(expressions) { this.expressions = freezeExpressions(expressions); Object.freeze(this); }
}
class Or {
  constructor(expressions) { this.expressions = freezeExpressions(expressions); Object.freeze(this); }
}
// Items are supplied already bound by the caller; domain expansion belongs outside this core.
class ForEach {
  constructor(expressions) { this.expressions = freezeExpressions(expressions); Object.freeze(this); }
}
function freezeExpressions(expressions) {
  if (!Array.isArray(expressions)) throw new EngineContractError('expressions must be an array');
  if (expressions.some(expression => !isExpression(expression))) {
    throw new EngineContractError('unsupported expression');
  }
  return Object.freeze(expressions.slice());
}
function isExpression(value) {
  return value instanceof PredicateCall || value instanceof Exists ||
    value instanceof AssertLiteral ||
    value instanceof All || value instanceof Or || value instanceof ForEach;
}

class CriterionIR {
  constructor({ criterionId, requirementId, expression, expectedResult = EngineResult.TRUE,
    applicability = null, nonconformityOnFalse = null, traceability = {} }) {
    this.criterionId = requireNonEmptyString(criterionId, 'criterionId');
    this.requirementId = requireNonEmptyString(requirementId, 'requirementId');
    if (!isExpression(expression)) throw new EngineContractError('expression is required');
    if (expectedResult !== EngineResult.TRUE) {
      throw new EngineContractError('Criterion ASSERT expectedResult must be TRUE');
    }
    if (applicability !== null && !isExpression(applicability)) {
      throw new EngineContractError('applicability must be an expression or null');
    }
    if (nonconformityOnFalse !== null &&
        (typeof nonconformityOnFalse !== 'string' || !nonconformityOnFalse.trim())) {
      throw new EngineContractError('nonconformityOnFalse must be a non-empty identifier or null');
    }
    if (!traceability || typeof traceability !== 'object' || Array.isArray(traceability)) {
      throw new EngineContractError('traceability must be an object');
    }
    this.expression = expression;
    this.expectedResult = expectedResult;
    this.applicability = applicability;
    this.nonconformityOnFalse = nonconformityOnFalse;
    this.traceability = immutableCopy(traceability);
    Object.freeze(this);
  }
}

function referencesIn(value, into = []) {
  if (value instanceof TypedReference) into.push(value);
  else if (Array.isArray(value)) value.forEach(item => referencesIn(item, into));
  else if (value && typeof value === 'object') Object.keys(value).sort().forEach(key => referencesIn(value[key], into));
  return into;
}

function assertMemory(memory) {
  if (!memory || typeof memory.contains !== 'function') {
    throw new EngineContractError('resolver context requires read-only memory.contains');
  }
}

function evaluateExpression(expression, registry, memory, context, correlationProjection) {
  assertMemory(memory);
  if (expression instanceof PredicateCall) {
    const contract = registry.resolve(expression.predicateId);
    const args = contract.argumentSchema.validate(expression.arguments);
    const resolved = contract.resolver.resolve(args, memory, context, correlationProjection);
    if (!resolved || !isPlainObject(resolved) ||
        !ENGINE_HAS_OWN_(resolved, 'result') ||
        !ENGINE_HAS_OWN_(resolved, 'memoryReferences') ||
        !['memoryReferences', 'result'].every(key => ENGINE_HAS_OWN_(resolved, key)) ||
        Object.keys(resolved).some(key => ![
          'memoryReferences', 'result', 'externalRelationTrace', 'documentaryEvidence'
        ].includes(key)) ||
        !Array.isArray(resolved.memoryReferences) ||
        resolved.memoryReferences.some(reference => !(reference instanceof TypedReference))) {
      throw new ResultContractError(expression.predicateId + ' resolver must return result and memoryReferences');
    }
    const result = resolved.result;
    if (!Object.values(EngineResult).includes(result)) {
      throw new ResultContractError(expression.predicateId + ' returned a non-EngineResult');
    }
    contract.validateResult(result);
    return Object.freeze({ result, trace: Object.freeze([Object.freeze({
      requirementId: context.requirementId,
      criterionId: context.criterionId,
      predicateId: expression.predicateId,
      arguments: args,
      result,
      argumentReferences: Object.freeze(referencesIn(args).slice()),
      memoryReferences: Object.freeze(resolved.memoryReferences.slice()),
      ...(resolved.externalRelationTrace === undefined ? {} : {
        externalRelationTrace: immutableCopy(resolved.externalRelationTrace)
      }),
      ...(resolved.documentaryEvidence === undefined ? {} : {
        documentaryEvidence: immutableCopy(resolved.documentaryEvidence)
      })
    })]) });
  }
  if (expression instanceof Exists) {
    const result = memory.contains(expression.reference) ? EngineResult.TRUE : EngineResult.FALSE;
    return Object.freeze({ result, trace: Object.freeze([Object.freeze({
      requirementId: context.requirementId,
      criterionId: context.criterionId,
      predicateId: 'EXISTS',
      arguments: Object.freeze({ reference: expression.reference }),
      result,
      argumentReferences: Object.freeze([expression.reference]),
      memoryReferences: Object.freeze([expression.reference])
    })]) });
  }
  if (expression instanceof AssertLiteral) {
    const invalidReference = expression.documentaryReferences.some(reference =>
      reference.kind === 'DOCUMENT_ABSENCE'
        ? memory.contains(reference)
        : !memory.contains(reference)
    );
    if (invalidReference) {
      throw new ResultContractError('ASSERT literal has an invalid documentary reference');
    }
    return Object.freeze({ result: expression.value, trace: Object.freeze([Object.freeze({
      requirementId: context.requirementId,
      criterionId: context.criterionId,
      predicateId: 'ASSERT_LITERAL',
      arguments: Object.freeze({ value: expression.value }),
      result: expression.value,
      argumentReferences: Object.freeze([]),
      memoryReferences: expression.documentaryReferences
    })]) });
  }
  if (expression instanceof All || expression instanceof ForEach || expression instanceof Or) {
    const evaluations = expression.expressions.map(child =>
      evaluateExpression(child, registry, memory, context, correlationProjection));
    const results = evaluations.map(item => item.result);
    if (results.includes(EngineResult.NOT_APPLICABLE)) {
      throw new CompositionContractError('NOT_APPLICABLE cannot be composed in ALL, OR, or FOR_EACH');
    }
    const result = expression instanceof Or ? combineOr(results) : combineAll(results);
    return Object.freeze({ result, trace: Object.freeze([].concat(...evaluations.map(item => item.trace))) });
  }
  throw new EngineContractError('unsupported expression');
}

function combineAll(results) {
  if (results.includes(EngineResult.FALSE)) return EngineResult.FALSE;
  if (results.includes(EngineResult.MANUAL_REVIEW)) return EngineResult.MANUAL_REVIEW;
  if (results.includes(EngineResult.UNKNOWN)) return EngineResult.UNKNOWN;
  return EngineResult.TRUE;
}
function combineOr(results) {
  if (results.includes(EngineResult.TRUE)) return EngineResult.TRUE;
  if (results.includes(EngineResult.MANUAL_REVIEW)) return EngineResult.MANUAL_REVIEW;
  if (results.includes(EngineResult.UNKNOWN)) return EngineResult.UNKNOWN;
  return EngineResult.FALSE;
}

function canonicalExecutionBindingIsValid_(binding, memory) {
  if (!binding || typeof binding.unitKey !== 'string' || !binding.unitKey ||
      (binding.role !== 'ASSERT' && binding.role !== 'VALIDATE') ||
      typeof isImmutableExecutionView !== 'function' ||
      !isImmutableExecutionView(memory) ||
      typeof isCanonicalCompiledRuntimeContract !== 'function' ||
      !isCanonicalCompiledRuntimeContract(binding.contract) ||
      typeof isCanonicalFrozenExecutionPlan !== 'function' ||
      !isCanonicalFrozenExecutionPlan(binding.plan, binding.contract, memory) ||
      typeof isCanonicalCurrentSubmissionContext !== 'function' ||
      !isCanonicalCurrentSubmissionContext(binding.currentSubmissionContext) ||
      typeof getAuthenticatedPresentationIdentity !== 'function' ||
      typeof selectCurrentComprovante !== 'function') return false;
  try {
    getAuthenticatedPresentationIdentity(binding.currentSubmissionContext);
    const selected = selectCurrentComprovante(memory, binding.currentSubmissionContext);
    const planned = binding.plan.selectedComprovante;
    return selected instanceof TypedReference && planned &&
      selected.kind === planned.kind && selected.identifier === planned.identifier;
  } catch (error) {
    return false;
  }
}

function executionIntegrityError_(message) {
  if (typeof criterionExecutionStop_ === 'function') criterionExecutionStop_(message);
  const error = new EngineContractError(message);
  error.code = 'EXECUTION_INTEGRITY_ERROR';
  throw error;
}

function evaluateCriterion_(criterion, registry, memory, correlationProjection = null, executionBinding = null) {
  if (!(criterion instanceof CriterionIR)) throw new EngineContractError('criterion must be CriterionIR');
  if (criterion.applicability !== null) {
    throw new EngineContractError('applicability evaluation is outside the Phase 1 core');
  }
  if (executionBinding !== null) {
    const bindingValid = canonicalExecutionBindingIsValid_(executionBinding, memory) &&
      typeof materializePlannedCriterion === 'function';
    if (!bindingValid) {
      executionIntegrityError_('execution binding is invalid');
    }
    let expectedCriterion;
    try {
      const materialized = materializePlannedCriterion(
        executionBinding.contract, executionBinding.plan, executionBinding.unitKey, memory);
      if (!materialized.unit || materialized.unit.unitKey !== executionBinding.unitKey) {
        executionIntegrityError_('materialized execution binding differs from requested unit');
      }
      expectedCriterion = executionBinding.role === 'VALIDATE'
        ? new CriterionIR({
          criterionId: materialized.criterion.criterionId,
          requirementId: materialized.criterion.requirementId,
          expression: materialized.validationExpression,
          expectedResult: EngineResult.TRUE,
          traceability: materialized.criterion.traceability
        })
        : materialized.criterion;
    } catch (error) {
      executionIntegrityError_('execution binding materialization failed');
    }
    if (JSON.stringify(canonicalCriterionExecutionValue_(criterion)) !==
        JSON.stringify(canonicalCriterionExecutionValue_(expectedCriterion))) {
      executionIntegrityError_('criterion differs from frozen execution binding');
    }
  }
  const context = new ResolverContext({ criterionId: criterion.criterionId, requirementId: criterion.requirementId });
  const evaluation = evaluateExpression(criterion.expression, registry, memory,
    { ...context, compiledContract: executionBinding && executionBinding.contract,
      executionPlan: executionBinding && executionBinding.plan,
      currentSubmissionContext: executionBinding && executionBinding.currentSubmissionContext,
      role: executionBinding && executionBinding.role }, correlationProjection);
  return evaluatedRecord(criterion, evaluation.result, evaluation.trace);
}

function canonicalCriterionExecutionValue_(value) {
  if (Array.isArray(value)) return value.map(canonicalCriterionExecutionValue_);
  if (value && typeof value === 'object') {
    const result = { __type: value.constructor && value.constructor.name || 'Object' };
    Object.keys(value).sort().forEach(key => {
      Object.defineProperty(result, key, {
        value: canonicalCriterionExecutionValue_(value[key]),
        enumerable: true,
        writable: true,
        configurable: true
      });
    });
    return result;
  }
  return value;
}

function normalizeEngineResult(engineResult) {
  const mapping = {
    TRUE: [PipelineResult.PASS, 'IDENTITY'],
    FALSE: [PipelineResult.FAIL, 'IDENTITY'],
    NOT_APPLICABLE: [PipelineResult.NOT_APPLICABLE, 'IDENTITY'],
    MANUAL_REVIEW: [PipelineResult.MANUAL_REVIEW, 'IDENTITY'],
    UNKNOWN: [PipelineResult.MANUAL_REVIEW, 'UNKNOWN_TO_MANUAL_REVIEW']
  };
  if (!ENGINE_HAS_OWN_(mapping, engineResult)) {
    throw new ResultContractError('unknown EngineResult: ' + engineResult);
  }
  return Object.freeze({
    pipelineResult: mapping[engineResult][0],
    normalization: mapping[engineResult][1]
  });
}

function evaluatedRecord(criterion, engineResult, trace) {
  const normalized = normalizeEngineResult(engineResult);
  return Object.freeze({
    criterionId: criterion.criterionId,
    requirementId: criterion.requirementId,
    resultOrigin: 'EVALUATED',
    evaluationPerformed: true,
    engineResult,
    pipelineResult: normalized.pipelineResult,
    normalization: normalized.normalization,
    trace: Object.freeze(trace.slice()),
    traceability: criterion.traceability,
    ...(engineResult === EngineResult.FALSE && criterion.nonconformityOnFalse !== null
      ? { nonconformityOnFalse: criterion.nonconformityOnFalse } : {})
  });
}

function propagateResult({ criterionId, requirementId, source, sourceUnit, sourceCriterion, propagationCause }) {
  requireNonEmptyString(criterionId, 'criterionId');
  requireNonEmptyString(requirementId, 'requirementId');
  requireNonEmptyString(propagationCause, 'propagationCause');
  if (!source || !['EVALUATED', 'PROPAGATED'].includes(source.resultOrigin) ||
      source.pipelineResult !== PipelineResult.MANUAL_REVIEW) {
    throw new EngineContractError('propagation source must be a MANUAL_REVIEW result');
  }
  if (source.resultOrigin === 'EVALUATED') {
    if (!Object.values(EngineResult).includes(source.engineResult) ||
        source.evaluationPerformed !== true || !Array.isArray(source.trace) ||
        !source.trace.length || !source.criterionId || !source.requirementId) {
      throw new EngineContractError('EVALUATED propagation source is missing its result trace');
    }
    source.trace.forEach(assertTraceEntry);
    const expected = normalizeEngineResult(source.engineResult);
    if (expected.pipelineResult !== source.pipelineResult || expected.normalization !== source.normalization ||
        source.trace.some(entry => entry.criterionId !== source.criterionId ||
          entry.requirementId !== source.requirementId)) {
      throw new EngineContractError('EVALUATED propagation source is missing its result trace');
    }
  } else if (ENGINE_HAS_OWN_(source, 'engineResult') ||
      ENGINE_HAS_OWN_(source, 'normalization') ||
      ENGINE_HAS_OWN_(source, 'trace') ||
      !Array.isArray(source.causalChain) || !source.causalChain.length ||
      source.evaluationPerformed !== false || !source.source || !source.propagationCause ||
      !source.criterionId || !source.requirementId) {
    throw new EngineContractError('PROPAGATED source is missing its causal chain');
  }
  if ((sourceUnit == null) === (sourceCriterion == null)) {
    throw new EngineContractError('provide exactly one sourceUnit or sourceCriterion');
  }
  if (sourceUnit != null) requireNonEmptyString(sourceUnit, 'sourceUnit');
  if (sourceCriterion != null) requireNonEmptyString(sourceCriterion, 'sourceCriterion');
  const sourceRef = makeSourceReference(sourceUnit, sourceCriterion);
  if (sourceRef.sourceCriterion && sourceRef.sourceCriterion !== source.criterionId) {
    throw new EngineContractError('sourceCriterion must identify the propagation source');
  }
  const priorChain = source.resultOrigin === 'PROPAGATED'
    ? validateCausalChain(source.causalChain, source)
    : Object.freeze([Object.freeze({
    criterionId: source.criterionId,
    requirementId: source.requirementId,
    resultOrigin: source.resultOrigin,
    engineResult: source.engineResult,
    pipelineResult: source.pipelineResult,
    normalization: source.normalization
  })]);
  const causalChain = Object.freeze(priorChain.concat(Object.freeze({
    criterionId,
    requirementId,
    source: sourceRef,
    propagationCause,
    resultOrigin: 'PROPAGATED',
    pipelineResult: PipelineResult.MANUAL_REVIEW
  })));
  return Object.freeze({
    criterionId, requirementId,
    resultOrigin: 'PROPAGATED',
    evaluationPerformed: false,
    pipelineResult: PipelineResult.MANUAL_REVIEW,
    source: sourceRef,
    propagationCause,
    causalChain
  });
}

function assertTraceEntry(entry) {
  if (!entry || typeof entry.criterionId !== 'string' || !entry.criterionId ||
      typeof entry.requirementId !== 'string' || !entry.requirementId ||
      typeof entry.predicateId !== 'string' || !entry.predicateId ||
      !Object.values(EngineResult).includes(entry.result) ||
      !isPlainObject(entry.arguments) || !Array.isArray(entry.argumentReferences) ||
      !Array.isArray(entry.memoryReferences) ||
      entry.argumentReferences.some(reference => !(reference instanceof TypedReference)) ||
      entry.memoryReferences.some(reference => !(reference instanceof TypedReference))) {
    throw new EngineContractError('EVALUATED propagation source has an invalid predicate trace');
  }
}

function makeSourceReference(sourceUnit, sourceCriterion) {
  if ((sourceUnit == null) === (sourceCriterion == null)) {
    throw new EngineContractError('provide exactly one sourceUnit or sourceCriterion');
  }
  if (sourceUnit != null) {
    return Object.freeze({ sourceUnit: requireNonEmptyString(sourceUnit, 'sourceUnit') });
  }
  return Object.freeze({ sourceCriterion: requireNonEmptyString(sourceCriterion, 'sourceCriterion') });
}

function validateCausalChain(chain, source) {
  if (!Array.isArray(chain) || chain.length < 2) {
    throw new EngineContractError('PROPAGATED source is missing its causal chain');
  }
  const copied = chain.map((entry, index) => {
    if (!entry || typeof entry.criterionId !== 'string' || !entry.criterionId ||
        typeof entry.requirementId !== 'string' || !entry.requirementId) {
      throw new EngineContractError('PROPAGATED source has an invalid causal chain entry');
    }
    if (index === 0) {
      if (entry.resultOrigin !== 'EVALUATED' || !Object.values(EngineResult).includes(entry.engineResult)) {
        throw new EngineContractError('causal chain must begin with an EVALUATED result');
      }
      const normalized = normalizeEngineResult(entry.engineResult);
      if (normalized.pipelineResult !== PipelineResult.MANUAL_REVIEW ||
          entry.pipelineResult !== normalized.pipelineResult ||
          entry.normalization !== normalized.normalization) {
        throw new EngineContractError('causal chain root has inconsistent normalization');
      }
      return Object.freeze({
        criterionId: entry.criterionId, requirementId: entry.requirementId,
        resultOrigin: 'EVALUATED', engineResult: entry.engineResult,
        pipelineResult: entry.pipelineResult, normalization: entry.normalization
      });
    }
    const ref = makeSourceReference(
      entry.source && entry.source.sourceUnit,
      entry.source && entry.source.sourceCriterion
    );
    if (entry.resultOrigin !== 'PROPAGATED' || entry.pipelineResult !== PipelineResult.MANUAL_REVIEW ||
        typeof entry.propagationCause !== 'string' || !entry.propagationCause) {
      throw new EngineContractError('causal chain has an invalid PROPAGATED entry');
    }
    return Object.freeze({
      criterionId: entry.criterionId, requirementId: entry.requirementId,
      source: ref, propagationCause: entry.propagationCause,
      resultOrigin: 'PROPAGATED', pipelineResult: PipelineResult.MANUAL_REVIEW
    });
  });
  copied.slice(1).forEach((entry, index) => {
    if (entry.source.sourceCriterion && entry.source.sourceCriterion !== copied[index].criterionId) {
      throw new EngineContractError('causal chain sourceCriterion does not identify its predecessor');
    }
  });
  const last = copied[copied.length - 1];
  if (last.criterionId !== source.criterionId || last.requirementId !== source.requirementId ||
      last.propagationCause !== source.propagationCause ||
      last.resultOrigin !== source.resultOrigin || last.pipelineResult !== source.pipelineResult) {
    throw new EngineContractError('causal chain does not end at the propagated source');
  }
  const priorSource = makeSourceReference(
    source.source && source.source.sourceUnit,
    source.source && source.source.sourceCriterion
  );
  if (JSON.stringify(last.source) !== JSON.stringify(priorSource)) {
    throw new EngineContractError('causal chain source link is inconsistent');
  }
  return Object.freeze(copied);
}
