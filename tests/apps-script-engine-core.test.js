const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');

const source = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'EngineCore.js'), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(source + `
globalThis.engineCore = {
  EngineResult, PipelineResult, ArgumentKind, EngineContractError,
  ArgumentContractError, PredicateNotFoundError, ResultContractError,
  CompositionContractError, TypedReference, ArgumentSpec, ArgumentSchema,
  ResolverContext, PredicateContract, PredicateRegistry, PredicateCall,
  Exists, AssertLiteral, All, Or, ForEach, CriterionIR, evaluateExpression,
  evaluateCriterion, normalizeEngineResult, propagateResult
};`, context);
const E = context.engineCore;
const { EngineResult: ER, PipelineResult: PR } = E;

function memory(references = []) {
  const present = new Set(references.map(ref => ref.kind + ':' + ref.identifier));
  return Object.freeze({ contains: ref => present.has(ref.kind + ':' + ref.identifier) });
}

function resolver(result, memoryReferences = []) {
  return { resolve() { return { result, memoryReferences }; } };
}

function contract(id, result, resultContract = Object.values(ER), schema = new E.ArgumentSchema([
  new E.ArgumentSpec({ name: 'subject', kind: E.ArgumentKind.REFERENCE })
])) {
  return new E.PredicateContract({
    predicateId: id, argumentSchema: schema, resultContract,
    resolver: resolver(result)
  });
}

function criterion(expression, id = 'TEST_CRITERION') {
  return new E.CriterionIR({
    criterionId: id, requirementId: 'TEST_REQUIREMENT', expression,
    expectedResult: ER.TRUE, traceability: { declarationSource: 'TEST_ONLY' }
  });
}

const ref = new E.TypedReference('TEST_ENTITY', 'one');
assert.throws(() => new E.TypedReference('', 'x'), /reference kind/);
assert.throws(() => new E.TypedReference('TEST_ENTITY', ' '), /reference identifier/);
assert(Object.isFrozen(ref));

const schema = new E.ArgumentSchema([
  new E.ArgumentSpec({ name: 'subject', kind: E.ArgumentKind.REFERENCE }),
  new E.ArgumentSpec({ name: 'label', kind: E.ArgumentKind.TEXT, required: false })
]);
assert.throws(() => schema.validate({}), /missing required argument/);
assert.throws(() => schema.validate({ subject: ref, extra: true }), /unknown arguments/);
assert.throws(() => schema.validate({ subject: 'not a reference' }), /not of type REFERENCE/);
assert.throws(() => new E.ArgumentSchema([
  new E.ArgumentSpec({ name: 'unsafe', kind: E.ArgumentKind.ANY })
]).validate({ unsafe: () => true }), /immutable JSON-like/);
const anySchema = new E.ArgumentSchema([
  new E.ArgumentSpec({ name: 'payload', kind: E.ArgumentKind.ANY })
]);
assert.deepEqual(JSON.parse(JSON.stringify(anySchema.validate({ payload: [{ x: 1 }, [1, 2]] }))),
  { payload: [{ x: 1 }, [1, 2]] });
const cyclic = [];
cyclic.push(cyclic);
assert.throws(() => anySchema.validate({ payload: cyclic }), /cyclic argument values/);
assert.deepEqual(JSON.parse(JSON.stringify(schema.validate({ subject: ref, label: 'x' }))), {
  subject: { kind: 'TEST_ENTITY', identifier: 'one' }, label: 'x'
});

const registry = new E.PredicateRegistry([contract('TEST_TRUE', ER.TRUE)]);
assert(Object.isFrozen(registry));
assert(Object.isFrozen(registry._contracts));
assert(Object.isFrozen(registry.resolve('TEST_TRUE').resolver));
assert.throws(() => registry.resolve('MISSING'), /predicate not found/);
assert.equal(Reflect.set(registry._contracts, 'TEST_FALSE', contract('TEST_FALSE', ER.FALSE)), false);
assert.equal(Reflect.set(registry.resolve('TEST_TRUE').resolver, 'resolve', () => ER.FALSE), false);

const ctx = new E.ResolverContext({ criterionId: 'C', requirementId: 'R' });
assert.throws(() => E.evaluateExpression(new E.PredicateCall('TEST_TRUE', { subject: ref }),
  new E.PredicateRegistry(), memory([ref]), ctx), /predicate not found/);
assert.throws(() => E.evaluateExpression(new E.PredicateCall('TEST_TRUE', { subject: ref }),
  new E.PredicateRegistry([contract('TEST_TRUE', ER.FALSE, [ER.TRUE])]), memory([ref]), ctx),
 /returned disallowed result/);

for (const [result, pipeline, normalization] of [
  [ER.TRUE, PR.PASS, 'IDENTITY'],
  [ER.FALSE, PR.FAIL, 'IDENTITY'],
  [ER.UNKNOWN, PR.MANUAL_REVIEW, 'UNKNOWN_TO_MANUAL_REVIEW'],
  [ER.NOT_APPLICABLE, PR.NOT_APPLICABLE, 'IDENTITY'],
  [ER.MANUAL_REVIEW, PR.MANUAL_REVIEW, 'IDENTITY']
]) {
  assert.deepEqual(JSON.parse(JSON.stringify(E.normalizeEngineResult(result))),
    { pipelineResult: pipeline, normalization });
  const allowedContract = contract('TEST_RESULT', result, [result]);
  const record = E.evaluateCriterion(criterion(
    new E.PredicateCall('TEST_RESULT', { subject: ref })
  ), new E.PredicateRegistry([allowedContract]), memory([ref]));
  assert.equal(record.engineResult, result);
  assert.equal(record.pipelineResult, pipeline);
  assert.equal(record.normalization, normalization);
  assert.equal(record.resultOrigin, 'EVALUATED');
  assert.equal(record.evaluationPerformed, true);
  assert.equal(record.trace[0].predicateId, 'TEST_RESULT');
}
assert.throws(() => E.normalizeEngineResult('toString'), /unknown EngineResult/);
const evidenceRef = new E.TypedReference('TEST_EVIDENCE', 'used-by-resolver');
const evidenceContract = new E.PredicateContract({
  predicateId: 'TEST_EVIDENCE_TRACE', argumentSchema: schema,
  resultContract: [ER.TRUE], resolver: resolver(ER.TRUE, [evidenceRef])
});
const evidenceRecord = E.evaluateCriterion(criterion(new E.PredicateCall(
  'TEST_EVIDENCE_TRACE', { subject: ref }
)), new E.PredicateRegistry([evidenceContract]), memory([ref, evidenceRef]));
assert.deepEqual(JSON.parse(JSON.stringify(evidenceRecord.trace[0].argumentReferences)),
  [{ kind: 'TEST_ENTITY', identifier: 'one' }]);
assert.deepEqual(JSON.parse(JSON.stringify(evidenceRecord.trace[0].memoryReferences)),
  [{ kind: 'TEST_EVIDENCE', identifier: 'used-by-resolver' }]);
const mutablePrototype = { resolve() { return { result: ER.TRUE, memoryReferences: [] }; } };
const inheritedResolver = Object.create(mutablePrototype);
const capturedContract = new E.PredicateContract({
  predicateId: 'TEST_CAPTURED', argumentSchema: schema,
  resultContract: [ER.TRUE], resolver: inheritedResolver
});
mutablePrototype.resolve = () => ({ result: ER.FALSE, memoryReferences: [] });
assert.equal(E.evaluateCriterion(criterion(new E.PredicateCall(
  'TEST_CAPTURED', { subject: ref, label: 'x' }
)), new E.PredicateRegistry([capturedContract]), memory([ref])).engineResult, ER.TRUE);

assert.throws(() => new E.PredicateContract({
  predicateId: 'TEST_NA', argumentSchema: new E.ArgumentSchema(),
  resultContract: [], resolver: resolver(ER.TRUE)
}), /resultContract must declare EngineResults/);
const naContract = contract('TEST_NA', ER.NOT_APPLICABLE, [ER.NOT_APPLICABLE], new E.ArgumentSchema());
const naCall = new E.PredicateCall('TEST_NA', {});
assert.equal(E.evaluateCriterion(criterion(naCall), new E.PredicateRegistry([naContract]),
  memory()).engineResult, ER.NOT_APPLICABLE);
assert.throws(() => E.evaluateCriterion(criterion(new E.All([naCall])),
  new E.PredicateRegistry([naContract]), memory()), /NOT_APPLICABLE cannot be composed/);
assert.throws(() => E.evaluateCriterion(criterion(new E.Or([naCall])),
  new E.PredicateRegistry([naContract]), memory()), /NOT_APPLICABLE cannot be composed/);
assert.throws(() => E.evaluateCriterion(criterion(new E.ForEach([naCall])),
  new E.PredicateRegistry([naContract]), memory()), /NOT_APPLICABLE cannot be composed/);

assert.throws(() => new E.CriterionIR({ criterionId: 'C', requirementId: 'R',
  expression: new E.Exists(ref), expectedResult: ER.FALSE }), /expectedResult must be TRUE/);

const contracts = Object.values(ER).map(result => contract('R_' + result, result, [result]));
const reg = new E.PredicateRegistry(contracts);
const call = result => new E.PredicateCall('R_' + result, { subject: ref });
const evaluate = expr => E.evaluateExpression(expr, reg, memory([ref]), ctx).result;
assert.equal(evaluate(new E.Exists(ref)), ER.TRUE);
assert.throws(() => new E.AssertLiteral(ER.FALSE), /only MANUAL_REVIEW/);
assert.throws(() => new E.AssertLiteral(ER.MANUAL_REVIEW, []), /requires a source document/);
const literalDocument = new E.TypedReference('DOCUMENT', 'literal-source');
const literalSection = new E.TypedReference('DOCUMENT_SECTION', 'literal-section');
const literalReview = E.evaluateCriterion(criterion(
  new E.AssertLiteral(ER.MANUAL_REVIEW, [literalDocument])
), reg, memory([literalDocument]));
assert.throws(() => E.evaluateCriterion(criterion(
  new E.AssertLiteral(ER.MANUAL_REVIEW, [literalDocument])
), reg, memory()), /invalid documentary reference/);
assert.throws(() => E.evaluateCriterion(criterion(
  new E.AssertLiteral(ER.MANUAL_REVIEW, [literalDocument, literalSection])
), reg, memory([literalDocument])), /invalid documentary reference/);
const literalReviewWithSection = E.evaluateCriterion(criterion(
  new E.AssertLiteral(ER.MANUAL_REVIEW, [literalDocument, literalSection])
), reg, memory([literalDocument, literalSection]));
assert.deepEqual(JSON.parse(JSON.stringify(literalReviewWithSection.trace[0].memoryReferences)), [
  { kind: 'DOCUMENT', identifier: 'literal-source' },
  { kind: 'DOCUMENT_SECTION', identifier: 'literal-section' }
]);
assert.equal(literalReview.engineResult, ER.MANUAL_REVIEW);
assert.equal(literalReview.pipelineResult, PR.MANUAL_REVIEW);
assert.equal(literalReview.normalization, 'IDENTITY');
assert.deepEqual(JSON.parse(JSON.stringify(literalReview.trace[0])), {
  requirementId: 'TEST_REQUIREMENT', criterionId: 'TEST_CRITERION',
  predicateId: 'ASSERT_LITERAL', arguments: { value: 'MANUAL_REVIEW' },
  result: 'MANUAL_REVIEW', argumentReferences: [],
  memoryReferences: [{ kind: 'DOCUMENT', identifier: 'literal-source' }]
});
const evaluateWithDocument = expr => E.evaluateExpression(
  expr, reg, memory([ref, literalDocument]), ctx
).result;
assert.equal(evaluateWithDocument(new E.Or([
  new E.Exists(ref), new E.AssertLiteral(ER.MANUAL_REVIEW, [literalDocument])
])), ER.TRUE);
assert.equal(evaluateWithDocument(new E.Or([
  new E.Exists(new E.TypedReference('TEST_ENTITY', 'missing')),
  new E.AssertLiteral(ER.MANUAL_REVIEW, [literalDocument])
])), ER.MANUAL_REVIEW);
assert.equal(E.evaluateExpression(new E.Exists(new E.TypedReference('TEST_ENTITY', 'missing')),
  reg, memory([ref]), ctx).result, ER.FALSE);
assert.equal(evaluate(new E.All([call(ER.TRUE), call(ER.UNKNOWN)])), ER.UNKNOWN);
assert.equal(evaluate(new E.All([call(ER.UNKNOWN), call(ER.MANUAL_REVIEW)])), ER.MANUAL_REVIEW);
assert.equal(evaluate(new E.All([call(ER.UNKNOWN), call(ER.FALSE)])), ER.FALSE);
assert.equal(evaluate(new E.Or([call(ER.FALSE), call(ER.UNKNOWN)])), ER.UNKNOWN);
assert.equal(evaluate(new E.Or([call(ER.UNKNOWN), call(ER.MANUAL_REVIEW)])), ER.MANUAL_REVIEW);
assert.equal(evaluate(new E.Or([call(ER.MANUAL_REVIEW), call(ER.TRUE)])), ER.TRUE);
assert.equal(evaluate(new E.ForEach([call(ER.TRUE), call(ER.FALSE)])), ER.FALSE);

const sourceRecord = E.evaluateCriterion(criterion(call(ER.UNKNOWN), 'SOURCE'), reg, memory([ref]));
const propagated = E.propagateResult({
  criterionId: 'DEPENDENT', requirementId: 'TEST_REQUIREMENT',
  source: sourceRecord, sourceUnit: 'UNIT_SOURCE', propagationCause: 'UPSTREAM_REVIEW'
});
assert.equal(propagated.resultOrigin, 'PROPAGATED');
assert.equal(propagated.pipelineResult, PR.MANUAL_REVIEW);
assert.equal(propagated.evaluationPerformed, false);
assert.equal(Object.hasOwn(propagated, 'engineResult'), false);
assert.equal(Object.hasOwn(propagated, 'normalization'), false);
assert.equal(Object.hasOwn(propagated, 'trace'), false);
assert.equal(propagated.causalChain[0].engineResult, ER.UNKNOWN);
assert.equal(propagated.causalChain[0].normalization, 'UNKNOWN_TO_MANUAL_REVIEW');
assert.equal(propagated.causalChain[0].criterionId, 'SOURCE');
assert.throws(() => E.propagateResult({
  criterionId: 'BAD_LINK', requirementId: 'TEST_REQUIREMENT',
  source: propagated, sourceCriterion: 'UNRELATED', propagationCause: 'UPSTREAM_REVIEW'
}), /sourceCriterion must identify the propagation source/);
const propagatedAgain = E.propagateResult({
  criterionId: 'NEXT', requirementId: 'TEST_REQUIREMENT',
  source: propagated, sourceCriterion: 'DEPENDENT', propagationCause: 'UPSTREAM_REVIEW'
});
assert.equal(propagatedAgain.causalChain.length, 3);
const brokenIntermediateLink = JSON.parse(JSON.stringify(propagatedAgain));
delete brokenIntermediateLink.causalChain[1].source.sourceUnit;
brokenIntermediateLink.causalChain[1].source.sourceCriterion = 'UNRELATED';
assert.throws(() => E.propagateResult({
  criterionId: 'AFTER_BROKEN_LINK', requirementId: 'TEST_REQUIREMENT',
  source: brokenIntermediateLink, sourceUnit: 'NEXT', propagationCause: 'UPSTREAM_REVIEW'
}), /sourceCriterion does not identify its predecessor/);
const mutablePropagationSource = JSON.parse(JSON.stringify(propagated));
const protectedChain = E.propagateResult({
  criterionId: 'PROTECTED', requirementId: 'TEST_REQUIREMENT',
  source: mutablePropagationSource, sourceUnit: 'DEPENDENT', propagationCause: 'UPSTREAM_REVIEW'
});
mutablePropagationSource.causalChain[0].criterionId = 'MUTATED_AFTER_RETURN';
assert.equal(protectedChain.causalChain[0].criterionId, 'SOURCE');
const inconsistentRoot = JSON.parse(JSON.stringify(propagated));
inconsistentRoot.causalChain[0].engineResult = ER.TRUE;
inconsistentRoot.causalChain[0].pipelineResult = PR.PASS;
inconsistentRoot.causalChain[0].normalization = 'IDENTITY';
assert.throws(() => E.propagateResult({
  criterionId: 'BAD_ROOT', requirementId: 'TEST_REQUIREMENT',
  source: inconsistentRoot, sourceUnit: 'DEPENDENT', propagationCause: 'UPSTREAM_REVIEW'
}), /causal chain root has inconsistent normalization/);
assert.throws(() => E.propagateResult({
  criterionId: 'INVALID', requirementId: 'R',
  source: E.evaluateCriterion(criterion(call(ER.TRUE), 'PASS_SOURCE'), reg, memory([ref])),
  sourceCriterion: 'SOURCE', propagationCause: 'NO_REVIEW'
}), /source must be a MANUAL_REVIEW result/);
assert.throws(() => E.propagateResult({
  criterionId: 'INVALID', requirementId: 'R',
  source: { resultOrigin: 'EVALUATED', pipelineResult: PR.MANUAL_REVIEW },
  sourceUnit: 'BAD_SOURCE', propagationCause: 'UPSTREAM_REVIEW'
}), /missing its result trace/);
assert.throws(() => E.propagateResult({
  criterionId: 'INVALID', requirementId: 'R',
  source: {
    criterionId: 'BAD', requirementId: 'R', resultOrigin: 'EVALUATED',
    evaluationPerformed: true, engineResult: ER.UNKNOWN, pipelineResult: PR.MANUAL_REVIEW,
    normalization: 'UNKNOWN_TO_MANUAL_REVIEW', trace: [{}]
  },
  sourceUnit: 'BAD_SOURCE', propagationCause: 'UPSTREAM_REVIEW'
}), /invalid predicate trace/);
assert.throws(() => E.propagateResult({
  criterionId: 'INVALID', requirementId: 'R',
  source: { resultOrigin: 'PROPAGATED', pipelineResult: PR.MANUAL_REVIEW },
  sourceUnit: 'BAD_SOURCE', propagationCause: 'UPSTREAM_REVIEW'
}), /missing its causal chain/);
assert.throws(() => E.propagateResult({
  criterionId: 'INVALID', requirementId: 'R',
  source: {
    criterionId: 'BAD', requirementId: 'R', resultOrigin: 'PROPAGATED',
    evaluationPerformed: false, pipelineResult: PR.MANUAL_REVIEW,
    source: {}, propagationCause: 'UPSTREAM_REVIEW', causalChain: [{}]
  },
  sourceUnit: 'BAD_SOURCE', propagationCause: 'UPSTREAM_REVIEW'
}), /causal chain/);
assert.throws(() => E.propagateResult({
  criterionId: 'INVALID', requirementId: 'R',
  source: {
    criterionId: 'BAD', requirementId: 'R', resultOrigin: 'PROPAGATED',
    evaluationPerformed: false, pipelineResult: PR.MANUAL_REVIEW,
    source: { sourceUnit: 'UPSTREAM' }, propagationCause: 'UPSTREAM_REVIEW',
    causalChain: [{ criterionId: 'ROOT', requirementId: 'R', resultOrigin: 'EVALUATED',
      engineResult: ER.UNKNOWN, pipelineResult: PR.MANUAL_REVIEW,
      normalization: 'UNKNOWN_TO_MANUAL_REVIEW' },
    { criterionId: 'BAD', requirementId: 'R', resultOrigin: 'PROPAGATED',
      pipelineResult: PR.MANUAL_REVIEW, source: { sourceUnit: 'UPSTREAM' },
      propagationCause: 'UPSTREAM_REVIEW' }], trace: [{}]
  },
  sourceUnit: 'BAD_SOURCE', propagationCause: 'UPSTREAM_REVIEW'
}), /missing its causal chain/);

const falseCriterion = new E.CriterionIR({
  criterionId: 'FALSE_WITH_NC', requirementId: 'TEST_REQUIREMENT',
  expression: call(ER.FALSE), nonconformityOnFalse: 'TEST_ONLY_NC'
});
const falseRecord = E.evaluateCriterion(falseCriterion, reg, memory([ref]));
assert.equal(falseRecord.pipelineResult, PR.FAIL);
assert.equal(falseRecord.nonconformityOnFalse, 'TEST_ONLY_NC');
assert.equal(Object.hasOwn(falseRecord, 'nonconformity'), false);

const nestedArgs = { subject: ref, payload: { tags: ['a', 'b'] } };
const immutableCall = new E.PredicateCall('TEST_TRUE', nestedArgs);
nestedArgs.payload.tags.push('mutated');
assert.deepEqual(immutableCall.arguments.payload.tags, ['a', 'b']);
assert(Object.isFrozen(immutableCall.arguments.payload.tags));
assert(Object.isFrozen(immutableCall.arguments.payload));
assert(Object.isFrozen(immutableCall));

const repeatCriterion = criterion(new E.All([call(ER.TRUE), call(ER.UNKNOWN)]));
const first = E.evaluateCriterion(repeatCriterion, reg, memory([ref]));
const second = E.evaluateCriterion(repeatCriterion, reg, memory([ref]));
assert.deepEqual(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(second)));
assert(Object.isFrozen(first));
assert(Object.isFrozen(first.trace));

for (const count of [100, 500, 1000]) {
  const synthetic = Array.from({ length: count }, (_, index) =>
    criterion(call(ER.TRUE), 'BENCH_' + index));
  const start = performance.now();
  synthetic.forEach(item => E.evaluateCriterion(item, reg, memory([ref])));
  console.log('BENCHMARK_CRITERIA=' + count + ' ELAPSED_MS=' + (performance.now() - start).toFixed(3));
}
console.log('apps-script-engine-core: PASS');
