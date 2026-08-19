import copy
import pathlib
import re
import unittest
from types import MappingProxyType


PIPELINE = (
    pathlib.Path(__file__).resolve().parents[1]
    / "knowledge-base"
    / "08_execution_pipeline.txt"
)
BASE = PIPELINE.parent


class ExecutionIntegrityError(ValueError):
    """Reference-test error; not a normative execution state."""


def build_plan(applicable_requirements, criteria_by_requirement, iteration_domains=None):
    """Build the small closed-plan model used only by these contract tests."""
    iteration_domains = iteration_domains or {}
    plan = []
    for requirement_id in applicable_requirements:
        for criterion_id in criteria_by_requirement[requirement_id]:
            unit = {
                "UNIT_KEY": (requirement_id, criterion_id),
                "applicability": applicable_requirements[requirement_id],
            }
            if (requirement_id, criterion_id) in iteration_domains:
                unit["ITERATION_DOMAIN"] = tuple(
                    iteration_domains[(requirement_id, criterion_id)]
                )
            plan.append(MappingProxyType(unit))
    return tuple(plan)


def validate_plan(applicable_requirements, criteria_by_requirement, plan, iterative_unit_keys=()):
    expected = {
        (requirement_id, criterion_id)
        for requirement_id in applicable_requirements
        for criterion_id in criteria_by_requirement[requirement_id]
    }
    actual = [unit["UNIT_KEY"] for unit in plan]
    iterative_unit_keys = set(iterative_unit_keys)
    if any(key in iterative_unit_keys and "ITERATION_DOMAIN" not in unit for key, unit in ((unit["UNIT_KEY"], unit) for unit in plan)):
        raise ExecutionIntegrityError("MISSING_ITERATION_DOMAIN")
    if len(actual) != len(set(actual)) or set(actual) != expected:
        raise ExecutionIntegrityError("BASE_TO_PLAN_INTEGRITY_ERROR")


def validate_results(plan, results):
    planned = {unit["UNIT_KEY"]: unit for unit in plan}
    result_keys = [result["UNIT_KEY"] for result in results]
    if len(result_keys) != len(set(result_keys)):
        raise ExecutionIntegrityError("DUPLICATE_RESULT")
    if set(result_keys) != set(planned):
        raise ExecutionIntegrityError("MISSING_OR_ORPHAN_RESULT")
    for unit in plan:
        result = next(item for item in results if item["UNIT_KEY"] == unit["UNIT_KEY"])
        if "ITERATION_DOMAIN" in unit:
            try:
                evaluated_bindings = result["evaluated_bindings"]
            except KeyError as error:
                raise ExecutionIntegrityError("MISSING_EVALUATED_BINDINGS") from error
            if tuple(evaluated_bindings) != tuple(unit["ITERATION_DOMAIN"]):
                raise ExecutionIntegrityError("ITERATION_DOMAIN_INTEGRITY_ERROR")
        if result.get("nonconformities", ()).count("NC_T1_002") > 1:
            raise ExecutionIntegrityError("DUPLICATE_AGGREGATED_NONCONFORMITY")


def report_and_projection_after_integrity(plan, results):
    validate_results(plan, results)
    return "IRV_PROJECTION", results


def extract_base_requirements():
    text = (BASE / "02_requirements.txt").read_text(encoding="utf-8")
    return set(re.findall(r"^REQUIREMENT\s+(\S+)", text, re.MULTILINE))


def extract_criterion_links(*paths):
    links = {}
    for path in paths:
        current = None
        for line in path.read_text(encoding="utf-8").splitlines():
            criterion = re.match(r"^CRITERION\s+(\S+)", line)
            if criterion:
                current = criterion.group(1)
                continue
            requirement = re.match(r"^(?:USES|REQUIREMENT)\s+(\S+)", line)
            if current and requirement:
                links.setdefault(current, set()).add(requirement.group(1))
    return links


class MinimalGuardContractTests(unittest.TestCase):
    def setUp(self):
        self.applicability = {
            "REQ_IN12_COMMISSIONING": {"PROCESS.SMSCI": "SMSCI_SDAI"},
            "REQ_IN08_ESTANQUEIDADE": {"PROCESS.SMSCI": "SMSCI_GAS"},
            "REQ_IN19_EXECUTION": {"PROCESS.SMSCI": "SMSCI_IEL"},
            "REQ_IN19_GROUNDING": {"PROCESS.SMSCI": "SMSCI_IEL"},
            "REQ_IN19_FINAL_VERIFICATION": {"PROCESS.SMSCI": "SMSCI_IEL"},
            "REQ_IN19_MAINTENANCE": {"PROCESS.SMSCI": "SMSCI_IEL"},
        }
        self.criteria = {
            "REQ_IN12_COMMISSIONING": ("T4_IN12_COMMISSIONING",),
            "REQ_IN08_ESTANQUEIDADE": ("T4_IN08_ESTANQUEIDADE",),
            "REQ_IN19_EXECUTION": ("T4_IN19_EXECUTION",),
            "REQ_IN19_GROUNDING": ("T4_IN19_GROUNDING",),
            "REQ_IN19_FINAL_VERIFICATION": ("T4_IN19_FINAL_VERIFICATION",),
            "REQ_IN19_MAINTENANCE": ("T4_IN19_MAINTENANCE",),
        }
        self.plan = build_plan(self.applicability, self.criteria)

    def test_pipeline_declares_closed_plan_and_integrity_boundary(self):
        text = PIPELINE.read_text(encoding="utf-8").upper()
        for term in (
            "PLANNED_EXECUTION_UNITS",
            "UNIT_KEY",
            "ITERATION_DOMAIN",
            "EXECUTION_INTEGRITY_ERROR",
            "EVALUATED_BINDINGS",
            "PLANNED_BINDINGS",
        ):
            self.assertIn(term, text)
        self.assertIn("IRV", text)
        self.assertIn("E-SCI", text)
        self.assertIn("DO NOT TRIGGER REPORT GENERATION", text)
        self.assertIn("IRV/E-SCI PROJECTION", text)
        for redundant in ("EXPECTED_CRITERIA", "SELECTED_CRITERIA", "EXECUTED_CRITERIA", "RESULT_LEDGER"):
            self.assertNotIn(redundant, text)

    def test_plan_is_ordered_read_only_and_fact_only(self):
        self.assertEqual(tuple(unit["UNIT_KEY"] for unit in self.plan), tuple(
            (requirement, criterion)
            for requirement in self.applicability
            for criterion in self.criteria[requirement]
        ))
        with self.assertRaises(TypeError):
            self.plan[0]["UNIT_KEY"] = ("OTHER", "OTHER")
        for unit in self.plan:
            self.assertNotIn("documentary_evidence", unit)
            self.assertNotIn("result", unit)
            self.assertNotIn("nonconformity", unit)
            self.assertNotIn("anticipated_nonconformity", unit)

    def test_iterative_unit_requires_iteration_domain(self):
        key = ("REQ_T1_DRT_SMSCI", "T1_DRT_SMSCI_COVERAGE")
        applicability = {"REQ_T1_DRT_SMSCI": {"PROCESS.SMSCI": ("PPE",)}}
        criteria = {"REQ_T1_DRT_SMSCI": ("T1_DRT_SMSCI_COVERAGE",)}
        plan = build_plan(applicability, criteria)
        with self.assertRaises(ExecutionIntegrityError):
            validate_plan(applicability, criteria, plan, (key,))
        complete = build_plan(applicability, criteria, {key: ("PPE",)})
        validate_plan(applicability, criteria, complete, (key,))

    def test_base_requirements_and_criteria_links_have_integral_coverage(self):
        requirements = extract_base_requirements()
        links = extract_criterion_links(BASE / "03_table1.txt", BASE / "04_table4.txt")
        linked_requirements = set().union(*links.values())
        self.assertTrue(requirements)
        self.assertEqual(linked_requirements, requirements)
        self.assertTrue(all(len(requirement_ids) == 1 for requirement_ids in links.values()))

    def test_all_applicable_requirements_and_criteria_enter_plan(self):
        validate_plan(self.applicability, self.criteria, self.plan)
        self.assertEqual(
            {unit["UNIT_KEY"] for unit in self.plan},
            {(requirement, criterion) for requirement in self.criteria for criterion in self.criteria[requirement]},
        )

    def test_omitted_criterion_is_detected(self):
        with self.assertRaises(ExecutionIntegrityError):
            validate_plan(self.applicability, self.criteria, self.plan[:-1])

    def test_extra_criterion_is_detected(self):
        extra = self.plan + ({"UNIT_KEY": ("REQ_IN12_COMMISSIONING", "C_EXTRA"), "applicability": self.applicability["REQ_IN12_COMMISSIONING"]},)
        with self.assertRaises(ExecutionIntegrityError):
            validate_plan(self.applicability, self.criteria, extra)

    def test_missing_evaluated_bindings_is_detected(self):
        key = ("REQ_T1_DRT_SMSCI", "T1_DRT_SMSCI_COVERAGE")
        plan = build_plan({"REQ_T1_DRT_SMSCI": {}}, {"REQ_T1_DRT_SMSCI": ("T1_DRT_SMSCI_COVERAGE",)}, {key: ("PPE",)})
        with self.assertRaises(ExecutionIntegrityError):
            validate_results(plan, [{"UNIT_KEY": key}])

    def test_exactly_one_result_per_unit_and_orphan_is_detected(self):
        results = [{"UNIT_KEY": unit["UNIT_KEY"]} for unit in self.plan]
        validate_results(self.plan, results)
        with self.assertRaises(ExecutionIntegrityError):
            validate_results(self.plan, results[:-1])
        with self.assertRaises(ExecutionIntegrityError):
            validate_results(self.plan, results + [{"UNIT_KEY": ("REQ_X", "C_X")}])

    def test_duplicate_result_is_detected(self):
        results = [{"UNIT_KEY": unit["UNIT_KEY"]} for unit in self.plan]
        results[-1] = results[0]
        with self.assertRaises(ExecutionIntegrityError):
            validate_results(self.plan, results)

    def test_for_each_requires_all_and_only_planned_bindings(self):
        applicability = {"REQ_T1_DRT_SMSCI": {"PROCESS.SMSCI": ("PPE", "SE", "IEL", "AI", "SAL")}}
        criteria = {"REQ_T1_DRT_SMSCI": ("T1_DRT_SMSCI_COVERAGE",)}
        domain = {("REQ_T1_DRT_SMSCI", "T1_DRT_SMSCI_COVERAGE"): ("PPE", "SE", "IEL", "AI", "SAL")}
        plan = build_plan(applicability, criteria, domain)
        results = [{"UNIT_KEY": plan[0]["UNIT_KEY"], "evaluated_bindings": ("PPE", "SE", "IEL", "AI", "SAL")}]
        validate_results(plan, results)
        results[0]["evaluated_bindings"] = ("PPE", "SE", "IEL", "AI")
        with self.assertRaises(ExecutionIntegrityError):
            validate_results(plan, results)

    def test_t1_drt_coverage_remains_one_aggregated_unit(self):
        plan = ({"UNIT_KEY": ("REQ_T1_DRT_SMSCI", "T1_DRT_SMSCI_COVERAGE"), "ITERATION_DOMAIN": ("PPE", "SE", "IEL", "AI", "SAL")},)
        results = [{"UNIT_KEY": plan[0]["UNIT_KEY"], "evaluated_bindings": ("PPE", "SE", "IEL", "AI", "SAL"), "nonconformities": ("NC_T1_002",)}]
        validate_results(plan, results)
        self.assertEqual(len(plan), 1)
        self.assertLessEqual(results[0]["nonconformities"].count("NC_T1_002"), 1)
        duplicate = copy.deepcopy(results)
        duplicate[0]["nonconformities"] = ("NC_T1_002", "NC_T1_002")
        with self.assertRaises(ExecutionIntegrityError):
            validate_results(plan, duplicate)

    def test_applicability_is_input_only_and_projection_follows_integrity(self):
        original = copy.deepcopy(self.applicability)
        results = [{"UNIT_KEY": unit["UNIT_KEY"]} for unit in self.plan]
        before = copy.deepcopy(self.applicability)
        plan = build_plan(self.applicability, self.criteria)
        self.assertEqual(self.applicability, before)
        projection, projected_results = report_and_projection_after_integrity(plan, results)
        self.assertEqual(projection, "IRV_PROJECTION")
        self.assertIs(projected_results, results)
        self.assertEqual(self.applicability, original)
        with self.assertRaises(ExecutionIntegrityError):
            report_and_projection_after_integrity(self.plan, results[:-1])


if __name__ == "__main__":
    unittest.main()
