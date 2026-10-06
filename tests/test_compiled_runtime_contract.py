import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest import mock


ROOT = __import__("pathlib").Path(__file__).resolve().parents[1]
BUILDER_PATH = ROOT / "tools" / "build_knowledge_base_release.py"
ARTIFACT = ROOT / "apps-script" / "CompiledRuntimeContract.js"


def load_builder():
    spec = importlib.util.spec_from_file_location("runtime_contract_builder", BUILDER_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


class CompiledRuntimeContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.builder = load_builder()
        cls.contract = cls.builder.compile_runtime_contract()

    def test_artifact_is_byte_identical_to_canonical_regeneration(self):
        self.assertEqual(
            ARTIFACT.read_bytes(),
            self.builder.render_runtime_contract().encode("utf-8"),
        )

    def test_release_build_gate_rejects_derived_artifact_drift(self):
        with tempfile.TemporaryDirectory() as temporary:
            artifact = Path(temporary) / "CompiledRuntimeContract.js"
            artifact.write_text("// stale", encoding="utf-8")
            with mock.patch.object(self.builder, "RUNTIME_CONTRACT", artifact):
                with self.assertRaisesRegex(RuntimeError, "diverge das fontes canônicas"):
                    self.builder.validate_runtime_contract_artifact()

    def test_artifact_is_marked_derived_and_identifies_sources(self):
        artifact = ARTIFACT.read_text(encoding="utf-8")
        self.assertIn("GENERATED_DERIVED_ARTIFACT", artifact)
        self.assertIn("DO_NOT_EDIT_AS_NORMATIVE_SOURCE", artifact)
        self.assertEqual(self.contract["knowledgeBase"]["id"], "SSCI-HABITESE")
        self.assertEqual(self.contract["knowledgeBase"]["version"], "5.6.0")
        self.assertEqual(
            self.contract["knowledgeBase"]["documentVersions"]["01_entities.txt"],
            "3.2.0",
        )

    def test_entity_catalog_is_exactly_derived_from_entity_declarations(self):
        source = self.builder.parse_entity_catalog(
            self.builder.ENTITIES.read_text(encoding="utf-8")
        )
        self.assertEqual(self.contract["entityCatalog"], source)
        for entity_id in (
            "COMPROVANTE_DE_SOLICITACAO_DE_HABITESE",
            "SISTEMAS_E_MEDIDAS_DE_SEGURANCA",
            "SISTEMAS_E_MEDIDAS_DE_SEGURANCA_ITEM",
        ):
            self.assertEqual(self.contract["entityCatalog"][entity_id], source[entity_id])

    def test_requirement_and_criterion_sets_and_order_are_source_derived(self):
        requirement_text = self.builder.REQUIREMENTS.read_text(encoding="utf-8")
        criteria_texts = tuple(
            source.read_text(encoding="utf-8") for source in self.builder.CRITERIA_SOURCES
        )
        requirements = self.contract["requirements"]
        criteria = self.contract["criteria"]
        self.assertEqual(
            [item["requirementId"] for item in requirements],
            [item[0] for item in self.builder.parse_requirements(requirement_text)],
        )
        self.assertEqual(
            [item["criterionId"] for item in criteria],
            [item[0] for source in criteria_texts for item in self.builder.parse_criteria(source)],
        )
        self.assertEqual(len(requirements), 30)
        self.assertEqual(len(criteria), 36)

    def test_pilot_criterion_assert_ir_is_exactly_source_derived(self):
        pilot = next(
            item for item in self.contract["criteria"]
            if item["criterionId"] == "T4_IN08_MANUAL"
        )
        self.assertEqual(pilot["sourceFile"], "04_table4.txt")
        self.assertEqual(
            pilot["assertIr"],
            {
                "type": "CALL",
                "name": "EXISTS",
                "arguments": [{"type": "SYMBOL", "value": "GAS_OWNER_MANUAL"}],
            },
        )
        self.assertEqual(pilot["failNonconformities"], ["NC_T4_003"])

    def test_assert_ir_parser_preserves_grouping_and_manual_review_literal(self):
        source = """
CRITERION TEST_ALL
TABLE 4
REQUIREMENT REQ_TEST
ASSERT ALL
EXISTS(TEST_DOCUMENT)
DRT_COVERS(TEST_DOCUMENT,SMSCI_TEST)
END
FAIL NC_TEST
END
CRITERION TEST_REVIEW
TABLE 4
REQUIREMENT REQ_REVIEW
ASSERT
EXISTS(TEST_DOCUMENT)
OR MANUAL_REVIEW
MANUAL_REVIEW "TEST_ONLY"
END
"""
        parsed = self.builder._parse_criterion_metadata(source)
        self.assertEqual(parsed[0]["assertIr"]["type"], "ALL")
        self.assertEqual(
            [item["name"] for item in parsed[0]["assertIr"]["expressions"]],
            ["EXISTS", "DRT_COVERS"],
        )
        self.assertEqual(
            parsed[1]["assertIr"],
            {
                "type": "OR",
                "expressions": [
                    {
                        "type": "CALL",
                        "name": "EXISTS",
                        "arguments": [{"type": "SYMBOL", "value": "TEST_DOCUMENT"}],
                    },
                    {"type": "LITERAL", "value": "MANUAL_REVIEW"},
                ],
            },
        )

    def test_structured_index_reuses_canonical_compiler_unit_keys_and_order(self):
        requirement_text = self.builder.REQUIREMENTS.read_text(encoding="utf-8")
        criteria_texts = tuple(
            source.read_text(encoding="utf-8") for source in self.builder.CRITERIA_SOURCES
        )
        canonical = self.builder.compile_execution_index(requirement_text, *criteria_texts)
        parsed = self.builder._parse_structured_execution_index(canonical)
        self.assertEqual(self.contract["compiledExecutionIndex"], parsed)
        for block in parsed:
            for unit in block["units"]:
                self.assertEqual(
                    unit["unitKey"],
                    f"UNIT_KEY ({unit['requirementId']}, {unit['criterionId']})",
                )
        smsci = next(
            item for item in parsed if item["requirementId"] == "REQ_T1_DRT_SMSCI"
        )
        self.assertEqual(len(smsci["units"]), 1)
        self.assertEqual(
            smsci["units"][0]["unitKey"],
            "UNIT_KEY (REQ_T1_DRT_SMSCI, T1_DRT_SMSCI_COVERAGE)",
        )
        self.assertEqual(smsci["iterationSource"], "WORKLIST.SMSCI")

    def test_official_map_is_exact_and_closed_against_canonical_entity_catalog(self):
        mapping = self.builder._parse_official_code_map(
            self.builder.APPLICABILITY.read_text(encoding="utf-8")
        )
        self.assertEqual(self.contract["officialEsciTargets"], mapping)
        self.assertEqual(len(mapping), 28)
        for item in mapping:
            entity = self.contract["entityCatalog"][item["entityId"]]
            self.assertEqual(entity["OFFICIAL_ESCI_CODE"], item["code"])
            self.assertEqual(
                entity["APPLICABILITY_TARGET_CLASS"], "OFFICIAL_ESCI_SCOPE"
            )

    def test_compiler_rejects_dangling_nonconformity_without_allowlist(self):
        source = self.builder.REQUIREMENTS.read_text(encoding="utf-8")
        marker = "REQUIREMENT REQ_T1_CONFORMITY_REPORT_SIGNED"
        block_start = source.index(marker)
        block_end = source.index("END", block_start)
        broken = source[:block_end] + "NONCONFORMITY NC_T1_003_SIGNED\n" + source[block_end:]
        with tempfile.TemporaryDirectory() as temporary:
            requirements = Path(temporary) / "02_requirements.txt"
            requirements.write_text(broken, encoding="utf-8")
            with mock.patch.object(self.builder, "REQUIREMENTS", requirements):
                with self.assertRaisesRegex(ValueError, "Nonconformity inexistente"):
                    self.builder.compile_runtime_contract()

    def test_compiler_rejects_entity_and_official_code_map_drift(self):
        source = self.builder.APPLICABILITY.read_text(encoding="utf-8")
        broken = source.replace("AVtr -> SMSCI_AVTR", "AVtr -> SMSCI_SAL", 1)
        with tempfile.TemporaryDirectory() as temporary:
            applicability = Path(temporary) / "02a_applicability.txt"
            applicability.write_text(broken, encoding="utf-8")
            with mock.patch.object(self.builder, "APPLICABILITY", applicability):
                with self.assertRaisesRegex(ValueError, "mapa oficial diverge"):
                    self.builder.compile_runtime_contract()

    def test_compiler_rejects_criterion_applies_to_drift_from_requirement_smsci(self):
        source_paths = self.builder.CRITERIA_SOURCES
        with tempfile.TemporaryDirectory() as temporary:
            temporary_paths = []
            for index, source_path in enumerate(source_paths):
                source = source_path.read_text(encoding="utf-8")
                if source_path.name == "04_table4.txt":
                    source = source.replace(
                        "CRITERION T4_IN08_ESTANQUEIDADE\n\nTABLE 4\n\n"
                        "APPLIES_TO SMSCI_GAS",
                        "CRITERION T4_IN08_ESTANQUEIDADE\n\nTABLE 4\n\n"
                        "APPLIES_TO SMSCI_PPE",
                        1,
                    )
                temporary_path = Path(temporary) / f"criteria-{index}.txt"
                temporary_path.write_text(source, encoding="utf-8")
                temporary_paths.append(temporary_path)
            with mock.patch.object(self.builder, "CRITERIA_SOURCES", tuple(temporary_paths)):
                with self.assertRaisesRegex(ValueError, "APPLIES_TO diverge do SMSCI"):
                    self.builder.compile_runtime_contract()

    def test_compiler_rejects_nonconformity_table_drift_from_criterion(self):
        source = self.builder.NONCONFORMITIES.read_text(encoding="utf-8")
        broken = source.replace(
            "NONCONFORMITY NC_T4_001\nTABLE 4",
            "NONCONFORMITY NC_T4_001\nTABLE 1",
            1,
        )
        with tempfile.TemporaryDirectory() as temporary:
            nonconformities = Path(temporary) / "05_nonconformities.txt"
            nonconformities.write_text(broken, encoding="utf-8")
            with mock.patch.object(self.builder, "NONCONFORMITIES", nonconformities):
                with self.assertRaisesRegex(ValueError, "TABLE de Nonconformity incompatível"):
                    self.builder.compile_runtime_contract()


if __name__ == "__main__":
    unittest.main()
