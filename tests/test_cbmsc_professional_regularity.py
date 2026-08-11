import unittest

from engine.cbmsc_predicates import (
    PREDICATE_ID,
    ProfessionalRegularityResolver,
)
from engine.criterion_ir import (
    ArgumentKind,
    ArgumentSchema,
    ArgumentSpec,
    CriterionIR,
    Engine,
    EngineContractError,
    EngineResult,
    ImmutableProcessMemory,
    PredicateCall,
    PredicateContract,
    PredicateRegistry,
    ResolverContext,
    Traceability,
    TypedReference,
)


class ProfessionalRegularityResolverTests(unittest.TestCase):

    def setUp(self):
        self.responsibility = TypedReference(
            "REQUIRED_TECHNICAL_RESPONSIBILITY",
            "RTR-001",
        )
        self.drt = TypedReference("DRT", "DRT-001")
        self.context = ResolverContext(
            "T1_DRT_PROFESSIONAL_REGULARITY",
            "REQ_T1_DRT_PROFESSIONAL_REGULARITY",
        )

    def engine(self):
        contract = PredicateContract(
            predicate_id=PREDICATE_ID,
            argument_schema=ArgumentSchema(
                (
                    ArgumentSpec(
                        "subject",
                        ArgumentKind.REFERENCE,
                    ),
                )
            ),
            allowed_results=frozenset(
                {
                    EngineResult.TRUE,
                    EngineResult.FALSE,
                    EngineResult.UNKNOWN,
                    EngineResult.MANUAL_REVIEW,
                }
            ),
            resolver=ProfessionalRegularityResolver(),
        )

        return Engine(PredicateRegistry((contract,)))

    def memory(self, council_state="SC", regularity=None, work_state=None):
        drt = {}

        if council_state is not None:
            drt["COUNCIL_STATE"] = council_state

        if work_state is not None:
            drt["WORK_STATE"] = work_state

        if regularity is not None:
            drt["PROFESSIONAL_REGULARITY"] = regularity

        return ImmutableProcessMemory(
            {
                self.responsibility: {
                    "drt_evidence": (self.drt,),
                },
                self.drt: drt,
            }
        )

    def evaluate(self, council_state="SC", regularity=None, work_state=None):
        return self.engine().evaluate_predicate(
            PREDICATE_ID,
            {"subject": self.responsibility},
            self.memory(council_state, regularity, work_state),
            self.context,
        )

    def test_sc_without_documented_irregularity_is_true(self):
        result = self.evaluate("SC")
        self.assertEqual(result.result, EngineResult.TRUE)

    def test_sc_regular_is_true(self):
        result = self.evaluate("SC", "REGULAR")
        self.assertEqual(result.result, EngineResult.TRUE)

    def test_sc_irregular_is_false(self):
        result = self.evaluate("SC", "IRREGULAR")
        self.assertEqual(result.result, EngineResult.FALSE)

    def test_br_without_documented_irregularity_is_true(self):
        result = self.evaluate("BR")
        self.assertEqual(result.result, EngineResult.TRUE)

    def test_br_regular_is_true(self):
        result = self.evaluate("BR", "REGULAR")
        self.assertEqual(result.result, EngineResult.TRUE)

    def test_br_irregular_is_false(self):
        result = self.evaluate("BR", "IRREGULAR")
        self.assertEqual(result.result, EngineResult.FALSE)

    def test_other_uf_requires_manual_review(self):
        result = self.evaluate("PR", "REGULAR")
        self.assertEqual(result.result, EngineResult.MANUAL_REVIEW)

    def test_other_uf_remains_manual_review_even_if_irregular(self):
        result = self.evaluate("PR", "IRREGULAR")
        self.assertEqual(result.result, EngineResult.MANUAL_REVIEW)

    def test_missing_council_state_requires_manual_review(self):
        result = self.evaluate(None, "REGULAR")
        self.assertEqual(result.result, EngineResult.MANUAL_REVIEW)

    def test_empty_council_state_requires_manual_review(self):
        result = self.evaluate("", "REGULAR")
        self.assertEqual(result.result, EngineResult.MANUAL_REVIEW)

    def test_work_state_does_not_replace_missing_council_state(self):
        result = self.evaluate(None, "REGULAR", work_state="SC")
        self.assertEqual(result.result, EngineResult.MANUAL_REVIEW)

    def test_missing_council_state_with_work_state_sc_is_manual_review(self):
        result = self.evaluate(None, work_state="SC")
        self.assertEqual(result.result, EngineResult.MANUAL_REVIEW)

    def test_missing_drt_evidence_requires_manual_review(self):
        memory = ImmutableProcessMemory(
            {
                self.responsibility: {
                    "drt_evidence": (),
                },
            }
        )

        result = self.engine().evaluate_predicate(
            PREDICATE_ID,
            {"subject": self.responsibility},
            memory,
            self.context,
        )

        self.assertEqual(result.result, EngineResult.MANUAL_REVIEW)

    def test_missing_drt_requires_manual_review(self):
        memory = ImmutableProcessMemory(
            {
                self.responsibility: {
                    "drt_evidence": (self.drt,),
                },
            }
        )

        result = self.engine().evaluate_predicate(
            PREDICATE_ID,
            {"subject": self.responsibility},
            memory,
            self.context,
        )

        self.assertEqual(result.result, EngineResult.MANUAL_REVIEW)

    def test_predicate_is_executed_by_generic_engine(self):
        result = self.evaluate("SC", "REGULAR")

        self.assertEqual(result.result, EngineResult.TRUE)
        self.assertEqual(
            result.trace[0].predicate_id,
            PREDICATE_ID,
        )

    def test_predicate_contract_rejects_not_applicable(self):
        with self.assertRaises(EngineContractError):
            PredicateContract(
                predicate_id=PREDICATE_ID,
                argument_schema=ArgumentSchema(
                    (
                        ArgumentSpec(
                            "subject",
                            ArgumentKind.REFERENCE,
                        ),
                    )
                ),
                allowed_results=frozenset({EngineResult.NOT_APPLICABLE}),
                resolver=ProfessionalRegularityResolver(),
            )

    def test_real_criterion_executes_through_engine(self):
        criterion = CriterionIR(
            criterion_id="T1_DRT_PROFESSIONAL_REGULARITY",
            requirement_id="REQ_T1_DRT_PROFESSIONAL_REGULARITY",
            applicability=None,
            expression=PredicateCall(
                PREDICATE_ID,
                {"subject": self.responsibility},
            ),
            expected_result=EngineResult.TRUE,
            nonconformity_on_false="NC_T1_009",
            traceability=Traceability(
                "knowledge-base/03_table1.txt"
            ),
        )

        evaluation = self.engine().evaluate_criterion(
            criterion,
            self.memory("SC", "REGULAR"),
        )

        self.assertEqual(
            evaluation.criterion_id,
            "T1_DRT_PROFESSIONAL_REGULARITY",
        )
        self.assertEqual(
            evaluation.requirement_id,
            "REQ_T1_DRT_PROFESSIONAL_REGULARITY",
        )
        self.assertEqual(
            evaluation.result,
            EngineResult.TRUE,
        )
        self.assertEqual(
            evaluation.trace[0].predicate_id,
            PREDICATE_ID,
        )
        self.assertEqual(
            evaluation.trace[0].requirement_id,
            "REQ_T1_DRT_PROFESSIONAL_REGULARITY",
        )
        self.assertEqual(
            evaluation.trace[0].criterion_id,
            "T1_DRT_PROFESSIONAL_REGULARITY",
        )
        self.assertEqual(
            evaluation.trace[0].arguments["subject"],
            self.responsibility,
        )


if __name__ == "__main__":
    unittest.main()
