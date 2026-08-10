import unittest

from engine.criterion_ir import (
    All,
    ArgumentKind,
    ArgumentSchema,
    ArgumentSpec,
    ArgumentContractError,
    CriterionIR,
    EngineContractError,
    DomainPredicateResolver,
    Engine,
    EngineResult,
    Exists,
    ForEach,
    ImmutableProcessMemory,
    Or,
    PredicateCall,
    PredicateContract,
    PredicateNotFoundError,
    PredicateRegistry,
    ResultContractError,
    ResolverContext,
    Traceability,
    TypedReference,
)


class StaticTestResolver(DomainPredicateResolver):
    def __init__(self, result):
        self.result = result
        self.received_memory = None

    def resolve(self, arguments, process_memory, context):
        self.received_memory = process_memory
        return self.result


class EngineInfrastructureTests(unittest.TestCase):
    def setUp(self):
        self.reference = TypedReference("TEST_ENTITY", "one")
        self.memory = ImmutableProcessMemory({self.reference: "fact"})
        self.context = ResolverContext("CRITERION_TEST", "REQUIREMENT_TEST")

    def contract(self, predicate_id, result):
        resolver = StaticTestResolver(result)
        contract = PredicateContract(
            predicate_id=predicate_id,
            argument_schema=ArgumentSchema(
                (ArgumentSpec("subject", ArgumentKind.REFERENCE),)
            ),
            allowed_results=frozenset({result}),
            resolver=resolver,
        )
        return contract, resolver

    def engine_for(self, result):
        contract, resolver = self.contract("TEST_RESULT", result)
        return Engine(PredicateRegistry((contract,))), resolver

    def call(self, engine):
        return engine.evaluate_predicate(
            "TEST_RESULT",
            {"subject": self.reference},
            self.memory,
            self.context,
        )

    def test_criterion_ir_creation(self):
        criterion = CriterionIR(
            criterion_id="CRITERION_TEST",
            requirement_id="REQUIREMENT_TEST",
            applicability=None,
            expression=PredicateCall("TEST_TRUE", {"subject": self.reference}),
            expected_result=EngineResult.TRUE,
            nonconformity_on_false=None,
            traceability=Traceability("base/test"),
        )
        self.assertEqual(criterion.criterion_id, "CRITERION_TEST")
        self.assertEqual(criterion.expected_result, EngineResult.TRUE)

    def test_predicate_expression_creation(self):
        expression = PredicateCall("TEST_TRUE", {"subject": self.reference})
        self.assertEqual(expression.predicate_id, "TEST_TRUE")
        self.assertIn("subject", expression.arguments)

    def test_registry_resolves_by_id(self):
        contract, _ = self.contract("TEST_TRUE", EngineResult.TRUE)
        registry = PredicateRegistry((contract,))
        self.assertIs(registry.resolve("TEST_TRUE"), contract)

    def test_registry_contract_set_is_immutable(self):
        contract, _ = self.contract("TEST_TRUE", EngineResult.TRUE)
        registry = PredicateRegistry((contract,))
        with self.assertRaises(TypeError):
            registry._contracts["TEST_OTHER"] = contract
        self.assertNotIn("TEST_OTHER", registry)

    def test_missing_predicate_is_rejected(self):
        engine = Engine(PredicateRegistry())
        with self.assertRaises(PredicateNotFoundError):
            engine.evaluate_predicate(
                "TEST_MISSING",
                {"subject": self.reference},
                self.memory,
                self.context,
            )

    def test_incompatible_arguments_are_rejected(self):
        engine, _ = self.engine_for(EngineResult.TRUE)
        with self.assertRaises(ArgumentContractError):
            self.call_with(engine, {"subject": "not-a-reference"})

    def call_with(self, engine, arguments):
        return engine.evaluate_predicate(
            "TEST_RESULT", arguments, self.memory, self.context
        )

    def test_expected_result_is_true_by_contract(self):
        with self.assertRaises(EngineContractError):
            CriterionIR(
                criterion_id="CRITERION_TEST",
                requirement_id="REQUIREMENT_TEST",
                applicability=None,
                expression=PredicateCall(
                    "TEST_TRUE", {"subject": self.reference}
                ),
                expected_result=EngineResult.FALSE,
                nonconformity_on_false=None,
                traceability=Traceability("base/test"),
            )

    def test_allowed_result_contract_is_enforced(self):
        contract, resolver = self.contract("TEST_TRUE", EngineResult.TRUE)
        resolver.result = EngineResult.FALSE
        engine = Engine(PredicateRegistry((contract,)))
        with self.assertRaises(ResultContractError):
            engine.evaluate_predicate(
                "TEST_TRUE",
                {"subject": self.reference},
                self.memory,
                self.context,
            )

    def test_result_propagation(self):
        for result in EngineResult:
            with self.subTest(result=result):
                engine, _ = self.engine_for(result)
                self.assertEqual(self.call(engine).result, result)

    def test_exists_uses_process_memory_only(self):
        expression = Exists(self.reference)
        engine = Engine(PredicateRegistry())
        evaluation = engine.evaluate_expression(expression, self.memory, self.context)
        self.assertEqual(evaluation.result, EngineResult.TRUE)
        self.assertEqual(evaluation.trace[0].predicate_id, "EXISTS")

        missing = Exists(TypedReference("TEST_ENTITY", "missing"))
        missing_evaluation = engine.evaluate_expression(
            missing, self.memory, self.context
        )
        self.assertEqual(missing_evaluation.result, EngineResult.FALSE)

    def test_all_precedence(self):
        contracts = [
            self.contract("TEST_FALSE", EngineResult.FALSE)[0],
            self.contract("TEST_UNKNOWN", EngineResult.UNKNOWN)[0],
            self.contract("TEST_MANUAL_REVIEW", EngineResult.MANUAL_REVIEW)[0],
        ]
        engine = Engine(PredicateRegistry(contracts))
        result = engine.evaluate_expression(
            All(
                (
                    PredicateCall("TEST_UNKNOWN", {"subject": self.reference}),
                    PredicateCall("TEST_MANUAL_REVIEW", {"subject": self.reference}),
                    PredicateCall("TEST_FALSE", {"subject": self.reference}),
                )
            ),
            self.memory,
            self.context,
        )
        self.assertEqual(result.result, EngineResult.FALSE)

        result = engine.evaluate_expression(
            All(
                (
                    PredicateCall("TEST_UNKNOWN", {"subject": self.reference}),
                    PredicateCall("TEST_MANUAL_REVIEW", {"subject": self.reference}),
                )
            ),
            self.memory,
            self.context,
        )
        self.assertEqual(result.result, EngineResult.MANUAL_REVIEW)

    def test_or_precedence(self):
        contracts = [
            self.contract("TEST_TRUE", EngineResult.TRUE)[0],
            self.contract("TEST_UNKNOWN", EngineResult.UNKNOWN)[0],
            self.contract("TEST_MANUAL_REVIEW", EngineResult.MANUAL_REVIEW)[0],
            self.contract("TEST_FALSE", EngineResult.FALSE)[0],
        ]
        engine = Engine(PredicateRegistry(contracts))
        result = engine.evaluate_expression(
            Or(
                (
                    PredicateCall("TEST_FALSE", {"subject": self.reference}),
                    PredicateCall("TEST_UNKNOWN", {"subject": self.reference}),
                    PredicateCall("TEST_MANUAL_REVIEW", {"subject": self.reference}),
                )
            ),
            self.memory,
            self.context,
        )
        self.assertEqual(result.result, EngineResult.MANUAL_REVIEW)

        result = engine.evaluate_expression(
            Or(
                (
                    PredicateCall("TEST_FALSE", {"subject": self.reference}),
                    PredicateCall("TEST_TRUE", {"subject": self.reference}),
                )
            ),
            self.memory,
            self.context,
        )
        self.assertEqual(result.result, EngineResult.TRUE)

    def test_for_each_is_structural_all(self):
        contracts = [
            self.contract("TEST_TRUE", EngineResult.TRUE)[0],
            self.contract("TEST_FALSE", EngineResult.FALSE)[0],
        ]
        engine = Engine(PredicateRegistry(contracts))
        expanded = (
            PredicateCall("TEST_TRUE", {"subject": self.reference}),
            PredicateCall("TEST_TRUE", {"subject": self.reference}),
        )
        expression = ForEach(expanded)
        self.assertEqual(expression.expressions, expanded)

        result = engine.evaluate_expression(
            expression,
            self.memory,
            self.context,
        )
        self.assertEqual(result.result, EngineResult.TRUE)

    def test_criterion_applicability_and_traceability(self):
        contract, resolver = self.contract("TEST_TRUE", EngineResult.TRUE)
        criterion = CriterionIR(
            criterion_id="CRITERION_TEST",
            requirement_id="REQUIREMENT_TEST",
            applicability=Exists(self.reference),
            expression=PredicateCall(
                "TEST_TRUE", {"subject": self.reference}
            ),
            expected_result=EngineResult.TRUE,
            nonconformity_on_false="TEST_NC",
            traceability=Traceability("base/test"),
        )
        evaluation = Engine(PredicateRegistry((contract,))).evaluate_criterion(
            criterion, self.memory
        )
        self.assertEqual(evaluation.result, EngineResult.TRUE)
        self.assertEqual(evaluation.traceability.declaration_source, "base/test")
        self.assertEqual(len(evaluation.trace), 2)
        self.assertEqual(evaluation.trace[1].predicate_id, "TEST_TRUE")
        self.assertEqual(evaluation.trace[1].memory_references, (self.reference,))

    def test_resolver_receives_only_process_memory_interface(self):
        engine, resolver = self.engine_for(EngineResult.TRUE)
        self.call(engine)
        self.assertIs(resolver.received_memory, self.memory)
        self.assertFalse(hasattr(resolver.received_memory, "documents"))
        self.assertFalse(hasattr(resolver.received_memory, "open"))


if __name__ == "__main__":
    unittest.main()
