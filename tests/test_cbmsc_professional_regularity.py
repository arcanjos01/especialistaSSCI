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

    def memory(self, council_state="SC", regularity=None):
        drt = {
            "COUNCIL_STATE": council_state,
        }

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

    def evaluate(self, council_state="SC", regularity=None):
        return self.engine().evaluate_predicate(
            PREDICATE_ID,
            {"subject": self.responsibility},
            self.memory(council_state, regularity),
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

    def test_other_uf_requires_manual_review(self):
        result = self.evaluate("PR", "REGULAR")
        self.assertEqual(result.result, EngineResult.MANUAL_REVIEW)

    def test_other_uf_remains_manual_review_even_if_irregular(self):
        result = self.evaluate("PR", "IRREGULAR")
        self.assertEqual(result.result, EngineResult.MANUAL_REVIEW)

    def test_missing_council_state_requires_manual_review(self):
        result = self.evaluate(None, "REGULAR")
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
