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
        self.assertRegex(self.pipeline, r"KNOWLEDGE_BASE_VERSION: 5\.1\.0")

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
        self.assertIn("Base: SSCI-Habite-se 5.1.0", operational)
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

    def test_identity_contract_does_not_define_normative_objects(self):
        manifest_section = self.pipeline.split(
            "# KNOWLEDGE BASE RELEASE MANIFEST", 1
        )[1].split("OBJECTIVE", 1)[0]
        self.assertNotRegex(
            manifest_section, r"(?m)^(REQUIREMENT|CRITERION|NONCONFORMITY)\s"
        )


if __name__ == "__main__":
    unittest.main()
