"""Contract tests for PR-1C SMSCI applicability resolution.

The small resolver below models only declared catalog semantics so the tests can
verify the documentary boundary without turning the Engine into a resolver.
"""

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "knowledge-base"

OFFICIAL_MAP = {
    "AVtr": "SMSCI_AVTR", "AI": "SMSCI_AI", "BI": "SMSCI_BI",
    "SPK": "SMSCI_SPRINKLER", "CSEP": "SMSCI_CSEP",
    "CMAR": "SMSCI_CMAR", "CF": "SMSCI_SMOKE_CONTROL",
    "COMP": "SMSCI_COMP", "CT": "SMSCI_CT", "CRP": "SMSCI_CRP",
    "DAI": "SMSCI_DAI", "EE": "SMSCI_EE", "IEL": "SMSCI_IEL",
    "IGC": "SMSCI_GAS", "IE": "SMSCI_IE", "IR": "SMSCI_IR",
    "MSP": "SMSCI_MSP", "TRRF": "SMSCI_TRRF", "PPE": "SMSCI_PPE",
    "SIESP": "SMSCI_SIESP", "SAN": "SMSCI_SAN", "SAL": "SMSCI_SAL",
    "SE": "SMSCI_SE", "SRPH": "SMSCI_SRPH", "SFG": "SMSCI_SFG",
    "SHP": "SMSCI_SHP", "SAP": "SMSCI_SAP", "SPDE": "SMSCI_PRESSURIZATION",
}

STRONG_REQUEST_IDENTIFIERS = frozenset({
    "REQUEST_IDENTIFIER", "PROTOCOL_IDENTIFIER",
})


class ArchitecturalBlocker(RuntimeError):
    """Synthetic pre-Engine interruption; not a global execution state."""


def productive_resolution(documents, current_identifiers):
    """Test model of the exact-source catalog and its explicit decisions."""
    candidates = []
    for document in documents:
        if document.get("type") != "COMPROVANTE_DE_SOLICITACAO_DE_HABITESE":
            continue
        identifiers = document.get("identifiers", {})
        comparable = set(identifiers) & set(current_identifiers)
        strong_comparable = comparable & STRONG_REQUEST_IDENTIFIERS
        matching_strong = {
            key for key in strong_comparable
            if identifiers[key] == current_identifiers[key]
        }
        conflicting_strong = strong_comparable - matching_strong
        if matching_strong and conflicting_strong:
            raise ArchitecturalBlocker("strong identifier conflict")
        if matching_strong and all(
            identifiers[key] == current_identifiers[key] for key in comparable
        ):
            candidates.append(document)
    if len(candidates) != 1:
        raise ArchitecturalBlocker("document selection")
    document = candidates[0]
    if not document.get("section_present") or not all(
        document.get(field) is True
        for field in ("structurally_complete", "legible", "verifiable")
    ):
        raise ArchitecturalBlocker("section")
    trace = document.get("trace", {})
    if set(trace) != {"process_memory_fact", "rde_record", "source_document"}:
        raise ArchitecturalBlocker("traceability")
    codes = set(document.get("official_codes", ()))
    if not codes <= set(OFFICIAL_MAP):
        raise ArchitecturalBlocker("unknown code")
    decisions = {target: "NEGATIVE" for target in OFFICIAL_MAP.values()}
    scope = set()
    for code in codes:
        target = OFFICIAL_MAP[code]
        decisions[target] = "POSITIVE"
        scope.add(target)
    if {"SMSCI_AI", "SMSCI_DAI"} & scope:
        scope.add("SMSCI_SDAI")
        decisions["SMSCI_SDAI"] = "POSITIVE"
    else:
        decisions["SMSCI_SDAI"] = "NEGATIVE"
    return {
        "process_smsci": frozenset(scope),
        "decisions": decisions,
        "trace": trace,
    }


def productive_resolve(documents, current_identifiers):
    return productive_resolution(documents, current_identifiers)["process_smsci"]


def entity_records(text):
    records, current, fields = {}, None, None
    for line in text.splitlines():
        if line.startswith("ENTITY "):
            current, fields = line.split(maxsplit=1)[1], {}
        elif current and line.startswith((
            "TYPE ", "OFFICIAL_ESCI_CODE ", "APPLICABILITY_TARGET_CLASS ",
        )):
            key, value = line.split(maxsplit=1)
            fields[key] = value
        elif current and line == "END":
            records[current] = fields
            current = fields = None
    return records


def requirement_metadata(text):
    records, current = {}, None
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
    records, current = {}, None
    for text in texts:
        for line in text.splitlines():
            if line.startswith("CRITERION "):
                current = line.split(maxsplit=1)[1]
            elif current and line.startswith(("REQUIREMENT ", "USES ")):
                records[current] = line.split(maxsplit=1)[1]
            elif current and line == "END":
                current = None
    return records


def applicable_requirement_ids(metadata, process_smsci):
    return {
        requirement_id
        for requirement_id, smsci in metadata.items()
        if smsci is None or smsci in process_smsci
    }


def selected_criterion_ids(associations, applicable_requirements):
    return {
        criterion_id
        for criterion_id, requirement_id in associations.items()
        if requirement_id in applicable_requirements
    }


def worklist_for_t1_drt_smsci(process_smsci, entities):
    return tuple(sorted(
        target for target in process_smsci
        if entities[target].get("APPLICABILITY_TARGET_CLASS")
        == "OFFICIAL_ESCI_SCOPE"
    ))


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
        cls.entities_text = (KB / "01_entities.txt").read_text()
        cls.entities = entity_records(cls.entities_text)
        cls.requirements = (KB / "02_requirements.txt").read_text()
        cls.table1 = (KB / "03_table1.txt").read_text()
        cls.table4 = (KB / "04_table4.txt").read_text()
        cls.reports = (KB / "06_reports.txt").read_text()
        cls.engine = (KB / "00_engine.txt").read_text()
        cls.requirement_records = requirement_metadata(cls.requirements)
        cls.criterion_records = criterion_requirements(cls.table1, cls.table4)

    def current_identifiers(self):
        return {
            "REQUEST_IDENTIFIER": "REQ-1",
            "PROCESS_IDENTIFIER": "PROC-1",
            "PROTOCOL_IDENTIFIER": "PROTO-1",
        }

    def current_document(self, codes=(), **extra):
        document = {
            "type": "COMPROVANTE_DE_SOLICITACAO_DE_HABITESE",
            "identifiers": self.current_identifiers(),
            "section_present": True,
            "structurally_complete": True,
            "legible": True,
            "verifiable": True,
            "official_codes": tuple(codes),
            "trace": {
                "process_memory_fact": "PM.COMPROVANTE.REQ-1.SMSCI",
                "rde_record": "RDE.COMPROVANTE.REQ-1.SMSCI",
                "source_document": "COMPROVANTE-REQ-1",
            },
        }
        document.update(extra)
        return document

    def test_a_exact_ppe_ie_sal_codes_select_only_their_canonical_targets(self):
        scope = productive_resolve(
            [self.current_document(("PPE", "IE", "SAL"))],
            self.current_identifiers(),
        )
        self.assertEqual(
            scope, frozenset({"SMSCI_PPE", "SMSCI_IE", "SMSCI_SAL"})
        )

    def test_b_igc_absence_is_negative_only_with_complete_verifiable_section(self):
        resolution = productive_resolution(
            [self.current_document(("PPE",))], self.current_identifiers()
        )
        scope = resolution["process_smsci"]
        self.assertEqual(resolution["decisions"]["SMSCI_GAS"], "NEGATIVE")
        self.assertNotIn("SMSCI_GAS", scope)
        with self.assertRaisesRegex(ArchitecturalBlocker, "section"):
            productive_resolve(
                [self.current_document(("PPE",), structurally_complete=False)],
                self.current_identifiers(),
            )

    def test_c_rpci_glp_text_is_ignored(self):
        scope = productive_resolve(
            [self.current_document((), rpci_orientative_text="GLP")],
            self.current_identifiers(),
        )
        self.assertNotIn("SMSCI_GAS", scope)
        self.assertIn("RPCI_ORIENTATIVE_TEXT", self.entities_text)
        self.assertIn("third RPCI\norientative-text column", self.applicability)

    def test_d_drt_art_is_ignored(self):
        scope = productive_resolve(
            [self.current_document((), art_smsci="IGC")],
            self.current_identifiers(),
        )
        self.assertNotIn("SMSCI_GAS", scope)
        self.assertIn("DRT, ART/RRT/TRT", self.applicability)

    def test_e_glp_mass_is_ignored(self):
        scope = productive_resolve(
            [self.current_document((), glp_mass_kg=190)],
            self.current_identifiers(),
        )
        self.assertNotIn("SMSCI_GAS", scope)
        self.assertIn("GLP_MASS_KG", self.applicability)

    def test_f_all_28_official_codes_are_representable_and_exact(self):
        self.assertEqual(len(OFFICIAL_MAP), 28)
        resolution = productive_resolution(
            [self.current_document(tuple(OFFICIAL_MAP))],
            self.current_identifiers(),
        )
        for target in OFFICIAL_MAP.values():
            self.assertEqual(resolution["decisions"][target], "POSITIVE")
            self.assertIn(target, resolution["process_smsci"])
        self.assertEqual(len(resolution["decisions"]), 29)
        official = {
            entity: fields for entity, fields in self.entities.items()
            if fields.get("TYPE") == "SMSCI"
            and fields.get("APPLICABILITY_TARGET_CLASS") == "OFFICIAL_ESCI_SCOPE"
        }
        self.assertEqual(set(official), set(OFFICIAL_MAP.values()))
        self.assertEqual(
            {fields.get("OFFICIAL_ESCI_CODE") for fields in official.values()},
            set(OFFICIAL_MAP),
        )

    def test_g_existing_mapping_and_official_aliases_are_preserved(self):
        expected = {
            "IE": "SMSCI_IE", "SAL": "SMSCI_SAL", "PPE": "SMSCI_PPE",
            "BI": "SMSCI_BI", "IGC": "SMSCI_GAS", "SHP": "SMSCI_SHP",
            "CF": "SMSCI_SMOKE_CONTROL", "SPK": "SMSCI_SPRINKLER",
            "CMAR": "SMSCI_CMAR", "IEL": "SMSCI_IEL",
            "SPDE": "SMSCI_PRESSURIZATION",
        }
        self.assertEqual({key: OFFICIAL_MAP[key] for key in expected}, expected)
        for alias in ("IGC", "CF", "SPK", "SPDE"):
            self.assertIn(alias, self.entities_text)
        self.assertIn("Alias normalization never activates", self.applicability)

    def test_h_se_is_official_and_has_t1_worklist_but_no_t4_criterion(self):
        scope = productive_resolve(
            [self.current_document(("SE",))], self.current_identifiers()
        )
        self.assertEqual(
            worklist_for_t1_drt_smsci(scope, self.entities), ("SMSCI_SE",)
        )
        self.assertNotIn("APPLIES_TO SMSCI_SE", self.table4)

    def test_i_shp_preserves_current_t4_scope(self):
        scope = productive_resolve(
            [self.current_document(("SHP",))], self.current_identifiers()
        )
        self.assertIn("SMSCI_SHP", scope)
        self.assertIn("APPLIES_TO SMSCI_SHP", self.table4)

    def test_j_documentary_incompleteness_blocks_before_engine(self):
        cases = (
            ([], "document selection"),
            ([self.current_document(section_present=False)], "section"),
            ([self.current_document(structurally_complete=False)], "section"),
            ([self.current_document(legible=False)], "section"),
            ([self.current_document(verifiable=False)], "section"),
        )
        for documents, message in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ArchitecturalBlocker, message):
                    productive_resolve(documents, self.current_identifiers())
        self.assertIn("ARCHITECTURAL_BLOCKER", self.applicability)
        self.assertIn("before the Engine", self.applicability)

    def test_k_laudo_central_glp_and_textual_mentions_do_not_activate(self):
        scope = productive_resolve(
            [self.current_document((), laudo="CENTRAL_GLP", mention="IGC")],
            self.current_identifiers(),
        )
        self.assertNotIn("SMSCI_GAS", scope)
        self.assertIn("CENTRAL_GLP", self.applicability)

    def test_l_multiple_or_nonmatching_comprovantes_block(self):
        documents = [self.current_document(), self.current_document()]
        with self.assertRaisesRegex(ArchitecturalBlocker, "document selection"):
            productive_resolve(documents, self.current_identifiers())
        old_return = self.current_document(
            identifiers={
                "REQUEST_IDENTIFIER": "REQ-OLD",
                "PROCESS_IDENTIFIER": "PROC-1",
                "PROTOCOL_IDENTIFIER": "PROTO-OLD",
            }
        )
        scope = productive_resolve(
            [old_return, self.current_document(("PPE",))],
            self.current_identifiers(),
        )
        self.assertEqual(scope, frozenset({"SMSCI_PPE"}))
        self.assertIn("Select exactly one comprovante", self.applicability)
        self.assertIn("Filename, newest date and\nattachment order", self.applicability)

    def test_l1_process_identifier_alone_cannot_select_current_request(self):
        current = {
            "REQUEST_IDENTIFIER": "REQ-2",
            "PROCESS_IDENTIFIER": "PROC-1",
            "PROTOCOL_IDENTIFIER": "H0002",
        }
        only_document = self.current_document(
            identifiers={"PROCESS_IDENTIFIER": "PROC-1"}
        )
        with self.assertRaisesRegex(ArchitecturalBlocker, "document selection"):
            productive_resolve([only_document], current)

    def test_l1b_conflicting_strong_identifiers_block(self):
        conflicting = self.current_document(
            identifiers={
                "REQUEST_IDENTIFIER": "REQ-1",
                "PROCESS_IDENTIFIER": "PROC-1",
                "PROTOCOL_IDENTIFIER": "PROTO-OLD",
            }
        )
        with self.assertRaisesRegex(
            ArchitecturalBlocker, "strong identifier conflict"
        ):
            productive_resolve([conflicting], self.current_identifiers())

    def test_l1c_generic_historical_document_does_not_compete(self):
        current = {
            "REQUEST_IDENTIFIER": "REQ-2",
            "PROCESS_IDENTIFIER": "PROC-1",
            "PROTOCOL_IDENTIFIER": "H0002",
        }
        current_document = self.current_document(
            ("PPE",), identifiers=current
        )
        historical_generic = self.current_document(
            identifiers={"PROCESS_IDENTIFIER": "PROC-1"}
        )
        scope = productive_resolve(
            [current_document, historical_generic], current
        )
        self.assertEqual(scope, frozenset({"SMSCI_PPE"}))

    def test_l1d_strong_match_with_different_process_does_not_select(self):
        current = {
            "REQUEST_IDENTIFIER": "REQ-2",
            "PROCESS_IDENTIFIER": "PROC-1",
            "PROTOCOL_IDENTIFIER": "H0002",
        }
        inconsistent = self.current_document(
            identifiers={
                "REQUEST_IDENTIFIER": "REQ-2",
                "PROCESS_IDENTIFIER": "PROC-OLD",
                "PROTOCOL_IDENTIFIER": "H0002",
            }
        )
        with self.assertRaisesRegex(ArchitecturalBlocker, "document selection"):
            productive_resolve([inconsistent], current)

    def test_l2_unknown_code_or_incomplete_trace_blocks(self):
        with self.assertRaisesRegex(ArchitecturalBlocker, "unknown code"):
            productive_resolve(
                [self.current_document(("NOT_OFFICIAL",))],
                self.current_identifiers(),
            )
        with self.assertRaisesRegex(ArchitecturalBlocker, "traceability"):
            productive_resolve(
                [self.current_document(("PPE",), trace={})],
                self.current_identifiers(),
            )

    def test_m_ai_and_dai_are_preserved_and_derive_sdai(self):
        scope = productive_resolve(
            [self.current_document(("AI", "DAI"))], self.current_identifiers()
        )
        self.assertTrue({"SMSCI_AI", "SMSCI_DAI", "SMSCI_SDAI"} <= scope)
        negative = productive_resolution(
            [self.current_document(())], self.current_identifiers()
        )
        self.assertNotIn("SMSCI_SDAI", negative["process_smsci"])
        self.assertEqual(negative["decisions"]["SMSCI_SDAI"], "NEGATIVE")
        self.assertIn("If both are negative", self.applicability)
        self.assertIn("Preserve AI and DAI", self.pipeline)

    def test_n_m5_and_other_internal_scopes_are_not_official_or_direct(self):
        for entity in (
            "SMSCI_M5", "SMSCI_SMOKE_CONTROL_MECHANICAL",
            "M5_EXPLOSION_PROTECTION", "M5_DUST_CONTROL", "M5_HEAT_SENSORS",
            "M5_LIGHTNING_PROTECTION",
        ):
            with self.subTest(entity=entity):
                self.assertEqual(
                    self.entities[entity]["APPLICABILITY_TARGET_CLASS"],
                    "DERIVED_INTERNAL_REQUIREMENT_SCOPE",
                )
                self.assertNotIn("OFFICIAL_ESCI_CODE", self.entities[entity])
        self.assertIn("M5 remains an explicit knowledge\ndebt", self.applicability)

    def test_o_engine_consumes_only_resolved_scope(self):
        scope = productive_resolve(
            [self.current_document(("PPE",))], self.current_identifiers()
        )
        self.assertEqual(SyntheticEngine().execute(scope), ("SMSCI_PPE",))
        self.assertIn("Engine consumes PROCESS.SMSCI", self.pipeline)
        self.assertIn("shall never create it", self.pipeline)
        self.assertIn("NO_NEW_SMSCI", self.engine)
        self.assertNotIn("ADD SMSCI", self.engine)

    def test_p_protected_requirements_tables_and_rde_semantics_remain_current(self):
        self.assertIn("REQUIREMENT REQ_T1_DRT_SMSCI", self.requirements)
        self.assertIn("CRITERION T1_DRT_SMSCI_COVERAGE", self.table1)
        self.assertIn("APPLIES_TO SMSCI_SDAI", self.table4)
        self.assertNotIn("APPLIES_TO SMSCI_SE", self.table4)
        self.assertIn("Documento 09-RDE", self.applicability)
        self.assertIn("does not alter Documento 09-RDE", self.pipeline)

    def test_q_base_inventory_and_invariants(self):
        expected = {
            "00_engine.txt", "01_entities.txt", "02_requirements.txt",
            "02a_applicability.txt", "03_table1.txt", "04_table4.txt",
            "05_nonconformities.txt", "06_reports.txt",
            "08_execution_pipeline.txt", "09_Especificacao_da_RDE.txt",
        }
        self.assertEqual({path.name for path in KB.glob("*.txt")}, expected)
        for invariant in (
            "ALIAS != APPLICABILITY", "TEXTUAL_OCCURRENCE != APPLICABILITY",
            "DOCUMENT_EXISTENCE != APPLICABILITY", "ENGINE DOES NOT CREATE SMSCI",
            "NO_EXTERNAL_KNOWLEDGE", "NO_ASSUMPTIONS", "NO_INFERENCE",
            "NO_NEW_RULES", "NO_NEW_SMSCI",
        ):
            self.assertIn(invariant, self.applicability)

    def test_r_existing_requirement_and_criterion_selection_regression(self):
        gas_scope = productive_resolve(
            [self.current_document(("IGC",))], self.current_identifiers()
        )
        applicable = applicable_requirement_ids(
            self.requirement_records, gas_scope
        )
        selected = selected_criterion_ids(
            self.criterion_records, applicable
        )
        self.assertIn("REQ_IN08_ESTANQUEIDADE", applicable)
        self.assertIn("REQ_IN08_MANUAL", applicable)
        self.assertIn("T4_IN08_ESTANQUEIDADE", selected)
        self.assertIn("T4_IN08_MANUAL", selected)

        ai_scope = productive_resolve(
            [self.current_document(("AI",))], self.current_identifiers()
        )
        ai_applicable = applicable_requirement_ids(
            self.requirement_records, ai_scope
        )
        ai_selected = selected_criterion_ids(
            self.criterion_records, ai_applicable
        )
        self.assertIn("REQ_IN12_COMMISSIONING", ai_applicable)
        self.assertIn("T4_IN12_COMMISSIONING", ai_selected)

    def test_s_general_requirements_bypass_smsci_gate_regression(self):
        applicable = applicable_requirement_ids(
            self.requirement_records, frozenset()
        )
        self.assertIn("REQ_T1_DRT_REQUIRED", applicable)
        self.assertIn("REQ_T1_DRT_SMSCI", applicable)

    def test_t_worklist_is_subset_and_excludes_derived_scope_regression(self):
        scope = productive_resolve(
            [self.current_document(("AI", "PPE", "SE"))],
            self.current_identifiers(),
        )
        worklist = set(worklist_for_t1_drt_smsci(scope, self.entities))
        self.assertTrue(worklist <= scope)
        self.assertEqual(worklist, {"SMSCI_AI", "SMSCI_PPE", "SMSCI_SE"})
        self.assertNotIn("SMSCI_SDAI", worklist)

    def test_u_closed_phase_boundaries_and_immutability_regression(self):
        for text in (self.applicability, self.pipeline):
            self.assertIn("PROCESS.SMSCI", text)
        for phase in ("PHASE 4A", "PHASE 4B", "PHASE 4C"):
            self.assertIn(phase, self.pipeline)
        for invariant in (
            "REQUIREMENT DOES NOT CREATE SMSCI",
            "CRITERION DOES NOT CREATE SMSCI",
            "REPORT DOES NOT CREATE SMSCI",
            "NO RULE != PERMISSION TO INFER",
            "NO EVIDENCE != PERMISSION TO INFER",
            "NO_NEW_OBJECTS",
            "NO_NEW_ATTRIBUTES",
            "NO_NEW_DOCUMENTS",
        ):
            self.assertIn(invariant, self.applicability)
        self.assertIn("The completed RDE becomes immutable", self.pipeline)
        self.assertIn("Close Process Memory as complete and immutable", self.pipeline)
        self.assertIn("Do not reopen Source Documents", self.pipeline)
        self.assertIn("No area, height or GLP rule is authorized", self.applicability)

    def test_v_reports_and_obsolete_reference_regression(self):
        self.assertIn("Utilize este modo em toda análise documental.", self.reports)
        for trigger in (
            "modo auditoria", "auditoria", "relatório completo",
            "modo validação", "modo homologação", "anexo técnico",
        ):
            self.assertIn(trigger, self.reports)
        self.assertIn("É proibido apresentar:", self.reports)
        self.assertNotIn("Versão do POP", self.reports)

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
