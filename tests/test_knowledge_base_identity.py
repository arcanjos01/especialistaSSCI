import importlib.util
import pathlib
import re
import tempfile
import unittest
from unittest import mock


ROOT = pathlib.Path(__file__).resolve().parents[1]
KB = ROOT / "knowledge-base"
PIPELINE = KB / "08_execution_pipeline.txt"
REPORTS = KB / "06_reports.txt"
BUILDER = ROOT / "tools" / "build_knowledge_base_release.py"


def load_builder():
    spec = importlib.util.spec_from_file_location("kb_release_builder", BUILDER)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


class KnowledgeBaseIdentityContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pipeline = PIPELINE.read_text(encoding="utf-8")
        cls.reports = REPORTS.read_text(encoding="utf-8")
        cls.builder = load_builder()
        cls.manifest = cls.builder.parse_manifest(cls.pipeline)
        cls.actual_documents = {path.name for path in KB.glob("*.txt")}

    def test_exactly_one_global_identity_and_required_fields(self):
        self.assertEqual(self.pipeline.count("KNOWLEDGE_BASE_ID:"), 1)
        self.assertEqual(self.pipeline.count("KNOWLEDGE_BASE_VERSION:"), 1)
        self.assertEqual(self.pipeline.count("SOURCE_COMMIT:"), 1)
        self.assertRegex(self.pipeline, r"KNOWLEDGE_BASE_ID: SSCI-HABITESE")
        self.assertRegex(self.pipeline, r"KNOWLEDGE_BASE_VERSION: 5\.2\.0")

    def test_manifest_matches_exactly_the_real_ten_document_set(self):
        self.assertEqual(len(self.actual_documents), 10)
        self.assertEqual(set(self.manifest), self.actual_documents)
        self.assertEqual(len(self.manifest), 10)

    def test_every_manifest_entry_has_an_individual_semantic_version(self):
        for filename, version in self.manifest.items():
            self.assertTrue((KB / filename).is_file())
            self.assertRegex(version, r"^\d+\.\d+\.\d+$")

    def test_existing_document_version_must_match_manifest(self):
        with self.assertRaises(ValueError):
            self.builder.inject_document_version(
                "DOCUMENT_VERSION: 9.9.9\n", "2.1.0"
            )

    def test_operational_report_exposes_only_short_global_release(self):
        operational, audit = self.reports.split("ANEXO TÉCNICO DE AUDITORIA", 1)
        self.assertIn("Base: SSCI-Habite-se 5.2.0", operational)
        self.assertNotIn("SOURCE_COMMIT:", operational)
        self.assertIn(
            "Não exibir no relatório operacional SOURCE_COMMIT, DOCUMENT_SET",
            operational,
        )
        self.assertNotRegex(operational, r"SOURCE_COMMIT: [0-9a-f]{7,40}")
        self.assertNotIn("DOCUMENT_VERSION por documento carregado:", operational)
        for field in ("KNOWLEDGE_BASE_ID:", "KNOWLEDGE_BASE_VERSION:", "SOURCE_COMMIT:"):
            self.assertIn(field, audit)

    def test_identity_mismatch_is_audit_only_and_non_normative(self):
        identity = self.reports.split("IDENTIDADE DA BASE", 1)[1].split(
            "Para cada execução utilizar", 1
        )[0]
        for required_guard in (
            "não é resultado",
            "MANUAL_REVIEW",
            "EXECUTION_INTEGRITY_ERROR",
            "Nonconformity",
            "pendência IRV/e-SCI",
            "não pode\nalterar os resultados consolidados",
        ):
            self.assertIn(required_guard, identity)

    def test_source_commit_is_resolved_only_by_clean_release_build(self):
        self.assertIn("SOURCE_COMMIT: RELEASE_BUILD_REQUIRED", self.pipeline)
        source = BUILDER.read_text(encoding="utf-8")
        self.assertIn('git("status", "--porcelain")', source)
        self.assertIn('git("rev-parse", "HEAD")', source)

    def test_builder_produces_exactly_ten_self_versioned_documents(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = pathlib.Path(temporary) / "release"
            with mock.patch.object(
                self.builder,
                "git",
                side_effect=lambda *args: ""
                if args == ("status", "--porcelain")
                else "0" * 40,
            ):
                self.builder.build(output)
            built = sorted(output.glob("*.txt"))
            self.assertEqual(len(built), 10)
            for path in built:
                text = path.read_text(encoding="utf-8")
                expected = self.manifest[path.name]
                self.assertRegex(
                    text,
                    rf"(?m)^#?\s*DOCUMENT_VERSION:\s*{re.escape(expected)}\s*$",
                )
            built_pipeline = (output / PIPELINE.name).read_text(encoding="utf-8")
            self.assertNotIn("SOURCE_COMMIT: RELEASE_BUILD_REQUIRED", built_pipeline)
            self.assertRegex(built_pipeline, r"SOURCE_COMMIT: [0-9a-f]{40}")

    def test_compiled_index_is_release_only_and_canonical(self):
        for sentinel in self.builder.DERIVED_ARTIFACT_SENTINELS:
            self.assertNotIn(sentinel, self.pipeline)
        requirements = (KB / "02_requirements.txt").read_text(encoding="utf-8")
        tables = tuple(
            path.read_text(encoding="utf-8") for path in self.builder.CRITERIA_SOURCES
        )
        index = self.builder.compile_execution_index(requirements, *tables)
        self.assertEqual(index, self.builder.compile_execution_index(requirements, *tables))
        self.assertNotIn("UNIT_07_ART_EXECUCAO_IGC", index)
        self.assertNotRegex(index, r"(?m)^  UNIT_[0-9]")
        basic = re.search(
            r"REQUIREMENT REQ_T1_DRT_BASIC_DATA\n(.*?)END", index, re.S
        ).group(1)
        self.assertEqual(
            re.findall(r"UNIT_KEY \([^,]+, ([^)]+)\)", basic),
            ["T1_DRT_RI_LEGAL_ENTITY", "T1_DRT_RT_NAME", "T1_DRT_ADDRESS", "T1_DRT_AREA"],
        )
        smsci = re.search(r"REQUIREMENT REQ_T1_DRT_SMSCI\n(.*?)END", index, re.S).group(1)
        self.assertEqual(re.findall(r"UNIT_KEY \(([^)]+)\)", smsci), ["REQ_T1_DRT_SMSCI, T1_DRT_SMSCI_COVERAGE"])
        self.assertIn("ITERATION_SOURCE WORKLIST.SMSCI", smsci)
        def unit_keys(requirement_id):
            block = re.search(rf"REQUIREMENT {requirement_id}\n(.*?)END", index, re.S).group(1)
            return re.findall(r"UNIT_KEY \(([^)]+)\)", block)

        self.assertEqual(
            unit_keys("REQ_IN08_ESTANQUEIDADE"),
            ["REQ_IN08_ESTANQUEIDADE, T4_IN08_ESTANQUEIDADE"],
        )
        self.assertEqual(
            unit_keys("REQ_IN08_MANUAL"),
            ["REQ_IN08_MANUAL, T4_IN08_MANUAL"],
        )
        process_smsci = {
            "SMSCI_PPE", "SMSCI_SE", "SMSCI_IE", "SMSCI_SAL", "SMSCI_GAS"
        }
        self.assertIn("SMSCI_GAS", process_smsci)
        for requirement_id, criterion_id in (
            ("REQ_IN08_ESTANQUEIDADE", "T4_IN08_ESTANQUEIDADE"),
            ("REQ_IN08_MANUAL", "T4_IN08_MANUAL"),
        ):
            source_block = re.search(
                rf"REQUIREMENT {requirement_id}\n(.*?)END", requirements, re.S
            ).group(1)
            self.assertIn("SMSCI SMSCI_GAS", source_block)
            self.assertIn(f"{requirement_id}, {criterion_id}", index)

        with tempfile.TemporaryDirectory() as temporary:
            output = pathlib.Path(temporary) / "release"
            with mock.patch.object(self.builder, "git", side_effect=lambda *args: "" if args == ("status", "--porcelain") else "0" * 40):
                self.builder.build(output)
            deployed = (output / PIPELINE.name).read_text(encoding="utf-8")
        self.assertIn(index, deployed)
        self.assertLess(deployed.index("COMPILED_EXECUTION_INDEX"), deployed.index("# PHASE 4C"))

    def test_compiler_rejects_basic_integrity_failures(self):
        with self.assertRaises(ValueError):
            self.builder.compile_execution_index("REQUIREMENT REQ_A\nEND\n", "CRITERION C_A\nUSES REQ_B\nEND\n")
        with self.assertRaises(ValueError):
            self.builder.compile_execution_index("REQUIREMENT REQ_A\nFOR_EACH A\nEND\n", "CRITERION C_A\nUSES REQ_A\nFOR_EACH B\nEND\n")
        with self.assertRaises(ValueError):
            self.builder.compile_execution_index("REQUIREMENT REQ_A\nEND\n", "CRITERION C_A\nUSES REQ_A\nUSES REQ_A\nEND\n")

    def test_identity_contract_does_not_define_normative_objects(self):
        manifest_section = self.pipeline.split(
            "# KNOWLEDGE BASE RELEASE MANIFEST", 1
        )[1].split("OBJECTIVE", 1)[0]
        self.assertNotRegex(
            manifest_section, r"(?m)^(REQUIREMENT|CRITERION|NONCONFORMITY)\s"
        )


if __name__ == "__main__":
    unittest.main()
