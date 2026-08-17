"""Contract tests for the SMSCI applicability boundary.

The resolver below is synthetic test scaffolding only.  Its fact and rule are
not productive Knowledge Base facts or applicability rules.
"""

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "knowledge-base"


class ArchitecturalBlocker(RuntimeError):
    """Synthetic pre-Engine interruption; not a global execution state."""


def synthetic_resolve(targets, facts, rules):
    """Resolve only complete explicit synthetic decisions for contract tests."""
    resolved = set()
    for target in targets:
        rule = rules.get(target)
        if rule is None:
            raise ArchitecturalBlocker("missing applicability rule")
        fact_id = rule.get("fact")
        fact = facts.get(fact_id)
        if not fact or fact.get("state") != "VERIFIABLE":
            raise ArchitecturalBlocker("incomplete applicability evidence or trace")
        if fact.get("source_scope") != rule.get("authorized_source_scope"):
            raise ArchitecturalBlocker("unauthorized source scope")
        if fact.get("required_by_smsci") == target:
            raise ArchitecturalBlocker("circular documentary activation")
        trace = rule.get("trace", {})
        if set(trace) != {"process_memory_fact", "rde_record", "source_document"}:
            raise ArchitecturalBlocker("incomplete applicability evidence or trace")
        decision = rule.get("decision")
        if decision == "INCLUDE":
            resolved.add(target)
        elif decision != "EXCLUDE":
            raise ArchitecturalBlocker("no explicit applicability decision")
    return frozenset(resolved)


def requirement_applicable(requirement_smsci, process_smsci):
    """Synthetic Phase 4B gate: general Requirements bypass SMSCI scope."""
    return requirement_smsci is None or requirement_smsci in process_smsci


def worklist_for_t1_drt_smsci(process_smsci):
    """Synthetic projection for the current declared iterator only."""
    return tuple(sorted(process_smsci))


def requirement_metadata(text):
    """Read only the declared Requirement id and SMSCI metadata."""
    records = {}
    current = None
    for line in text.splitlines():
        if line.startswith("REQUIREMENT "):
            current = line.split(maxsplit=1)[1]
            records[current] = None
        elif current and line.startswith("SMSCI "):
            records[current] = line.split(maxsplit=1)[1]
        elif current and line == "END":
            current = None
    return records


def criterion_requirements(*texts):
    """Read the existing Criterion -> Requirement/USES associations."""
    records = {}
    current = None
    for text in texts:
        for line in text.splitlines():
            if line.startswith("CRITERION "):
                current = line.split(maxsplit=1)[1]
            elif current and (
                line.startswith("REQUIREMENT ") or line.startswith("USES ")
            ):
                records[current] = line.split(maxsplit=1)[1]
            elif current and line == "END":
                current = None
    return records


def applicable_requirement_ids(metadata, process_smsci):
    return {
        requirement_id
        for requirement_id, smsci in metadata.items()
        if requirement_applicable(smsci, process_smsci)
    }


def selected_criterion_ids(associations, applicable_requirements):
    return {
        criterion_id
        for criterion_id, requirement_id in associations.items()
        if requirement_id in applicable_requirements
    }


def canonical_smsci_ids(text):
    """Enumerate canonical TYPE SMSCI entities without treating aliases as ids."""
    records = set()
    current = None
    for line in text.splitlines():
        if line.startswith("ENTITY "):
            current = line.split(maxsplit=1)[1]
        elif current and line == "TYPE SMSCI":
            records.add(current)
        elif current and line == "END":
            current = None
    return records


class SyntheticEngine:
    """Proves consumption only: this test double never derives SMSCI scope."""
    def execute(self, process_smsci):
        return tuple(sorted(process_smsci))


class ApplicabilityResolutionContractTests(unittest.TestCase):
    maxDiff = None

    @classmethod
    def setUpClass(cls):
        cls.applicability = (KB / "02a_applicability.txt").read_text()
        cls.pipeline = (KB / "08_execution_pipeline.txt").read_text()
        cls.requirements = (KB / "02_requirements.txt").read_text()
        cls.table1 = (KB / "03_table1.txt").read_text()
        cls.table4 = (KB / "04_table4.txt").read_text()
        cls.reports = (KB / "06_reports.txt").read_text()
        cls.entities = (KB / "01_entities.txt").read_text()
        cls.engine = (KB / "00_engine.txt").read_text()
        cls.requirement_records = requirement_metadata(cls.requirements)
        cls.criterion_records = criterion_requirements(cls.table1, cls.table4)

    def synthetic_gas_scope(self):
        # This synthetic PPCI-scope fact/rule is test-only, never Base content.
        facts = {
            "TEST.AUTHORIZED_SCOPE": {
                "state": "VERIFIABLE",
                "source_scope": "TEST_APPROVED_SCOPE",
            }
        }
        rules = {
            "SMSCI_GAS": {
                "fact": "TEST.AUTHORIZED_SCOPE",
                "authorized_source_scope": "TEST_APPROVED_SCOPE",
                "decision": "INCLUDE",
                "trace": {
                    "process_memory_fact": "TEST.AUTHORIZED_SCOPE",
                    "rde_record": "TEST.RDE.RECORD",
                    "source_document": "TEST.SOURCE.DOCUMENT",
                },
            }
        }
        return synthetic_resolve({"SMSCI_GAS"}, facts, rules)

    def test_a_synthetic_positive_rule_selects_real_gas_requirements_and_criteria(self):
        scope = self.synthetic_gas_scope()
        self.assertEqual(scope, frozenset({"SMSCI_GAS"}))
        applicable = applicable_requirement_ids(self.requirement_records, scope)
        selected = selected_criterion_ids(self.criterion_records, applicable)
        self.assertIn("REQ_IN08_ESTANQUEIDADE", applicable)
        self.assertIn("REQ_IN08_MANUAL", applicable)
        self.assertIn("T4_IN08_ESTANQUEIDADE", selected)
        self.assertIn("T4_IN08_MANUAL", selected)

    def test_b_insufficient_evidence_does_not_infer(self):
        with self.assertRaisesRegex(ArchitecturalBlocker, "incomplete"):
            synthetic_resolve(
                {"SMSCI_GAS"},
                {
                    "TEST.AUTHORIZED_SCOPE": {
                        "state": "INCOMPLETE",
                        "source_scope": "TEST_APPROVED_SCOPE",
                    }
                },
                {
                    "SMSCI_GAS": {
                        "fact": "TEST.AUTHORIZED_SCOPE",
                        "authorized_source_scope": "TEST_APPROVED_SCOPE",
                        "decision": "INCLUDE",
                        "trace": {},
                    }
                },
            )

    def test_c_aliases_and_normalized_values_do_not_activate_smsci(self):
        canonical = canonical_smsci_ids(self.entities)
        self.assertIn("SMSCI_GAS", canonical)
        self.assertIn("SMSCI_IE", canonical)
        for value in ("GLP", "GAS", "CENTRAL_GLP"):
            with self.subTest(value=value):
                self.assertIn(value, self.entities)
                self.assertNotIn(value, canonical)
                with self.assertRaisesRegex(ArchitecturalBlocker, "missing"):
                    synthetic_resolve(
                        {"SMSCI_GAS"},
                        {
                            "NORMALIZED": {
                                "state": "VERIFIABLE",
                                "source_scope": "NORMALIZATION",
                                "value": value,
                            }
                        },
                        {},
                    )

    def test_d_required_documents_cannot_self_activate_smsci(self):
        for document in ("laudo", "manual", "DRT", "relatório"):
            with self.subTest(document=document):
                facts = {
                    document: {
                        "state": "VERIFIABLE",
                        "source_scope": "TECHNICAL_DOCUMENT",
                        "required_by_smsci": "SMSCI_GAS",
                    }
                }
                rules = {
                    "SMSCI_GAS": {
                        "fact": document,
                        "authorized_source_scope": "TECHNICAL_DOCUMENT",
                        "decision": "INCLUDE",
                        "trace": {
                            "process_memory_fact": document,
                            "rde_record": "TEST.RDE.RECORD",
                            "source_document": document,
                        },
                    }
                }
                with self.assertRaisesRegex(
                    ArchitecturalBlocker, "circular documentary activation"
                ):
                    synthetic_resolve({"SMSCI_GAS"}, facts, rules)

    def test_e_general_requirement_bypasses_smsci_gate(self):
        applicable = applicable_requirement_ids(
            self.requirement_records, frozenset()
        )
        self.assertIn("REQ_T1_DRT_REQUIRED", applicable)

    def test_f_worklist_is_a_subset_of_resolved_scope(self):
        scope = frozenset({"SMSCI_GAS", "SMSCI_SHP"})
        worklist = set(worklist_for_t1_drt_smsci(scope))
        self.assertTrue(worklist <= scope)
        self.assertNotIn("SMSCI_IEL", worklist)

    def test_g_missing_rule_blocks_without_not_applicable_conversion(self):
        with self.assertRaisesRegex(ArchitecturalBlocker, "missing applicability rule"):
            synthetic_resolve({"SMSCI_GAS"}, {}, {})
        self.assertIn("ARCHITECTURAL_BLOCKER", self.applicability)
        self.assertIn("shall not be\nconverted to NOT_APPLICABLE", self.applicability)

    def test_h_engine_consumes_resolved_scope_and_does_not_create_it(self):
        scope = self.synthetic_gas_scope()
        self.assertEqual(SyntheticEngine().execute(scope), ("SMSCI_GAS",))
        self.assertIn("Engine consumes PROCESS.SMSCI", self.pipeline)
        self.assertIn("shall never create it", self.pipeline)
        self.assertIn("NO_NEW_SMSCI", self.engine)
        self.assertIn(
            "IF APPLIES_TO IS NOT PRESENT IN PROCESS.SMSCI", self.engine
        )
        self.assertNotIn("ADD SMSCI", self.engine)

    def test_i_reports_and_base_inventory_contract(self):
        self.assertIn("Utilize este modo em toda análise documental.", self.reports)
        for trigger in ("modo auditoria", "auditoria", "relatório completo", "modo validação", "modo homologação", "anexo técnico"):
            self.assertIn(trigger, self.reports)
        self.assertIn("É proibido apresentar:", self.reports)
        self.assertNotIn("Versão do POP", self.reports)

        expected = {
            "00_engine.txt", "01_entities.txt", "02_requirements.txt",
            "02a_applicability.txt", "03_table1.txt", "04_table4.txt",
            "05_nonconformities.txt", "06_reports.txt",
            "08_execution_pipeline.txt", "09_Especificacao_da_RDE.txt",
        }
        actual = {path.name for path in KB.glob("*.txt")}
        self.assertEqual(actual, expected)

    def test_base_contract_contains_closed_phase_boundaries_and_invariants(self):
        for text in (self.applicability, self.pipeline):
            self.assertIn("PROCESS.SMSCI", text)
        for invariant in (
            "ALIAS != APPLICABILITY",
            "TEXTUAL_OCCURRENCE != APPLICABILITY",
            "DOCUMENT_EXISTENCE != APPLICABILITY",
            "REQUIREMENT DOES NOT CREATE SMSCI",
            "CRITERION DOES NOT CREATE SMSCI",
            "REPORT DOES NOT CREATE SMSCI",
            "ENGINE DOES NOT CREATE SMSCI",
            "NO RULE != PERMISSION TO INFER",
            "NO EVIDENCE != PERMISSION TO INFER",
            "NO_EXTERNAL_KNOWLEDGE",
            "NO_ASSUMPTIONS",
            "NO_INFERENCE",
            "NO_NEW_RULES",
            "NO_NEW_OBJECTS",
            "NO_NEW_ATTRIBUTES",
            "NO_NEW_DOCUMENTS",
            "NO_NEW_SMSCI",
        ):
            self.assertIn(invariant, self.applicability)
        for phase in ("PHASE 4A", "PHASE 4B", "PHASE 4C"):
            self.assertIn(phase, self.pipeline)

    def test_no_obsolete_report_references_outside_history_or_tmp(self):
        obsolete_names = (
            "06_report_" + "operacional",
            "07_report_" + "auditoria",
        )
        findings = []
        for path in ROOT.rglob("*"):
            if (
                not path.is_file()
                or ".git" in path.parts
                or "tmp" in path.parts
                or path == Path(__file__).resolve()
                or path.suffix not in {".txt", ".py", ".md"}
            ):
                continue
            text = path.read_text(errors="replace")
            for obsolete in obsolete_names:
                if obsolete in text:
                    findings.append(f"{path.relative_to(ROOT)}: {obsolete}")
        self.assertEqual(findings, [])


if __name__ == "__main__":
    unittest.main()
