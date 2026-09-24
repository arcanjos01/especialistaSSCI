import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "knowledge-base"
ENGINE = (KB / "00_engine.txt").read_text(encoding="utf-8")
ENTITIES = (KB / "01_entities.txt").read_text(encoding="utf-8")
REQUIREMENTS = (KB / "02_requirements.txt").read_text(encoding="utf-8")
TABLE1 = (KB / "03_table1.txt").read_text(encoding="utf-8")
NONCONFORMITIES = (KB / "05_nonconformities.txt").read_text(encoding="utf-8")
REPORTS = (KB / "06_reports.txt").read_text(encoding="utf-8")
PIPELINE = (KB / "08_execution_pipeline.txt").read_text(encoding="utf-8")


class StateAndDRTValidityContractTests(unittest.TestCase):
    def test_unknown_is_canonical_end_to_end(self):
        self.assertIn("UNKNOWN\n\nUNKNOWN is a canonical Criterion result", PIPELINE)
        self.assertIn(
            "VERIFICATIONS_EXECUTED = PASS + FAIL + NOT_APPLICABLE + MANUAL_REVIEW + UNKNOWN",
            PIPELINE,
        )
        self.assertIn("resultados UNKNOWN", REPORTS)
        self.assertIn("Critérios UNKNOWN", REPORTS)

    def test_manual_review_does_not_suppress_assert(self):
        self.assertIn("IF ASSERT_RESULT IS NOT FALSE\n\n        EXECUTE ASSERT", ENGINE)
        self.assertNotIn(
            "IF ASSERT_RESULT IS NOT FALSE\n       AND ASSERT_RESULT IS NOT MANUAL_REVIEW",
            ENGINE,
        )
        self.assertIn("FALSE > MANUAL_REVIEW > UNKNOWN > TRUE", ENGINE)

    def test_registration_and_payment_are_independent_facts(self):
        for attribute in (
            "ATTRIBUTE REGISTERED BOOLEAN",
            "ATTRIBUTE REGISTRATION_DATE DATE",
            "ATTRIBUTE PAID BOOLEAN",
            "ATTRIBUTE PAYMENT_DATE DATE",
            "ATTRIBUTE PAYMENT_REQUIRED_FOR_VALIDITY BOOLEAN",
        ):
            self.assertIn(attribute, ENTITIES)
        self.assertIn("An unpaid DRT may still be\nREGISTERED=TRUE", PIPELINE)

    def test_payment_validity_is_separate_from_registration(self):
        self.assertIn("REQUIREMENT REQ_T1_DRT_REGISTERED", REQUIREMENTS)
        self.assertIn("REQUIREMENT REQ_T1_DRT_PAYMENT_VALIDITY", REQUIREMENTS)
        self.assertIn("CRITERION T1_DRT_PAYMENT_VALIDITY", TABLE1)
        self.assertIn("FAIL NC_T1_010", TABLE1)
        self.assertIn("NONCONFORMITY NC_T1_010", NONCONFORMITIES)
        block = re.search(
            r"NONCONFORMITY NC_T1_010\n(.*?)\nEND",
            NONCONFORMITIES,
            re.S,
        ).group(1)
        self.assertNotIn("IRV_TABLE", block)
        self.assertNotIn("IRV_SUBCAUSE", block)

    def test_unpaid_does_not_mean_unregistered(self):
        self.assertIn(
            "AN UNPAID OR PAYMENT-PENDING DRT SHALL NEVER, BY ITSELF, MAKE REGISTERED FALSE.",
            ENGINE,
        )

    def test_dangling_signed_nc_is_removed(self):
        self.assertNotIn("NC_T1_003_SIGNED", REQUIREMENTS)
        self.assertNotIn("NC_T1_003_SIGNED", NONCONFORMITIES)


if __name__ == "__main__":
    unittest.main()
