/* Núcleo agnóstico do Criterion IR. Sem APIs Apps Script ou dependências externas. */

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
  if (!value || Object.prototype.toString.call(value) !== '[object Object]') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}

class TypedReference {
  constructor(kind, identifier) {
    this.kind = requireNonEmptyString(kind, 'reference kind');
    this.identifier = requireNonEmptyString(identifier, 'reference identifier');
    Object.freeze(this);
  }
}

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
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    if (active.includes(value)) throw new ArgumentContractError('cyclic argument values are not supported');
    const nextActive = active.concat([value]);
    return Object.freeze(value.map(item => immutableCopy(item, nextActive)));
  }
  if (isPlainObject(value)) {
    if (active.includes(value)) throw new ArgumentContractError('cyclic argument values are not supported');
    const nextActive = active.concat(value);
    const copy = {};
    Object.keys(value).sort().forEach(key => {
      Object.defineProperty(copy, key, {
        value: immutableCopy(value[key], nextActive), enumerable: true,
        writable: false, configurable: false
      });
    });
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
      if (!Object.prototype.hasOwnProperty.call(argumentsByName, spec.name)) {
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
      validated[spec.name] = immutableCopy(spec.many ? values : value);
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
      if (Object.prototype.hasOwnProperty.call(entries, contract.predicateId)) {
        throw new EngineContractError('duplicate predicateId: ' + contract.predicateId);
      }
      Object.defineProperty(entries, contract.predicateId, {
        value: contract, enumerable: true, writable: false, configurable: false
      });
    });
    this._contracts = Object.freeze(entries);
    Object.freeze(this);
  }

  resolve(predicateId) {
    if (!Object.prototype.hasOwnProperty.call(this._contracts, predicateId)) {
      throw new PredicateNotFoundError('predicate not found: ' + predicateId);
    }
    return this._contracts[predicateId];
  }
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

function evaluateExpression(expression, registry, memory, context) {
  assertMemory(memory);
  if (expression instanceof PredicateCall) {
    const contract = registry.resolve(expression.predicateId);
    const args = contract.argumentSchema.validate(expression.arguments);
    const resolved = contract.resolver.resolve(args, memory, context);
    if (!resolved || !isPlainObject(resolved) ||
        !Object.prototype.hasOwnProperty.call(resolved, 'result') ||
        !Object.prototype.hasOwnProperty.call(resolved, 'memoryReferences') ||
        Object.keys(resolved).sort().join(',') !== 'memoryReferences,result' ||
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
      memoryReferences: Object.freeze(resolved.memoryReferences.slice())
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
      (reference.kind === 'DOCUMENT' && !memory.contains(reference)) ||
      (reference.kind === 'DOCUMENT_ABSENCE' && memory.contains(reference))
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
      evaluateExpression(child, registry, memory, context));
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

function evaluateCriterion(criterion, registry, memory) {
  if (!(criterion instanceof CriterionIR)) throw new EngineContractError('criterion must be CriterionIR');
  if (criterion.applicability !== null) {
    throw new EngineContractError('applicability evaluation is outside the Phase 1 core');
  }
  const context = new ResolverContext({ criterionId: criterion.criterionId, requirementId: criterion.requirementId });
  const evaluation = evaluateExpression(criterion.expression, registry, memory, context);
  return evaluatedRecord(criterion, evaluation.result, evaluation.trace);
}

function normalizeEngineResult(engineResult) {
  const mapping = {
    TRUE: [PipelineResult.PASS, 'IDENTITY'],
    FALSE: [PipelineResult.FAIL, 'IDENTITY'],
    NOT_APPLICABLE: [PipelineResult.NOT_APPLICABLE, 'IDENTITY'],
    MANUAL_REVIEW: [PipelineResult.MANUAL_REVIEW, 'IDENTITY'],
    UNKNOWN: [PipelineResult.MANUAL_REVIEW, 'UNKNOWN_TO_MANUAL_REVIEW']
  };
  if (!Object.prototype.hasOwnProperty.call(mapping, engineResult)) {
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
  } else if (Object.prototype.hasOwnProperty.call(source, 'engineResult') ||
      Object.prototype.hasOwnProperty.call(source, 'normalization') ||
      Object.prototype.hasOwnProperty.call(source, 'trace') ||
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
