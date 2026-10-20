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
        cls.engine = (KB / "00_engine.txt").read_text(encoding="utf-8")
        cls.requirements = (KB / "02_requirements.txt").read_text(encoding="utf-8")
        cls.table_1 = (KB / "03_table1.txt").read_text(encoding="utf-8")
        cls.table_4 = (KB / "04_table4.txt").read_text(encoding="utf-8")
        cls.reports = REPORTS.read_text(encoding="utf-8")
        cls.migration_plan = (ROOT / "docs" / "PLANO_MIGRACAO_ENGINE_APPS_SCRIPT.md").read_text(encoding="utf-8")
        cls.coverage_inventory = (ROOT / "docs" / "FASE_6_INVENTARIO_COBERTURA.md").read_text(encoding="utf-8")
        cls.builder = load_builder()
        cls.manifest = cls.builder.parse_manifest(cls.pipeline)
        cls.actual_documents = {path.name for path in KB.glob("*.txt")}

    def test_exactly_one_global_identity_and_required_fields(self):
        self.assertEqual(self.pipeline.count("KNOWLEDGE_BASE_ID:"), 1)
        self.assertEqual(self.pipeline.count("KNOWLEDGE_BASE_VERSION:"), 1)
        self.assertEqual(self.pipeline.count("SOURCE_COMMIT:"), 1)
        self.assertRegex(self.pipeline, r"KNOWLEDGE_BASE_ID: SSCI-HABITESE")
        self.assertRegex(self.pipeline, r"KNOWLEDGE_BASE_VERSION: 5\.30\.0")

    def test_manifest_matches_exactly_the_real_ten_document_set(self):
        self.assertEqual(len(self.actual_documents), 10)
        self.assertEqual(set(self.manifest), self.actual_documents)
        self.assertEqual(len(self.manifest), 10)

    def test_every_manifest_entry_has_an_individual_semantic_version(self):
        for filename, version in self.manifest.items():
            self.assertTrue((KB / filename).is_file())
            self.assertRegex(version, r"^\d+\.\d+\.\d+$")

    def test_document_absence_requires_exact_complete_inventory(self):
        engine = re.sub(r"\s+", " ", self.engine)
        pipeline = re.sub(r"\s+", " ", self.pipeline)
        self.assertIn(
            "DOCUMENT_ABSENCE IS VALID EVIDENCE ONLY WHEN AN AUTHENTICATED, COMPLETE DOCUMENT INVENTORY IS BOUND TO THE EXACT PRESENTATION AND RDE",
            engine,
        )
        self.assertIn(
            "AN EMPTY ENTITY COLLECTION, A MISSING DOCUMENTARY ASSOCIATION, OR AN UNRESOLVED LOOKUP DOES NOT ESTABLISH DOCUMENT_ABSENCE",
            engine,
        )
        self.assertIn(
            "An empty entity-reference collection, missing documentary association or unresolved lookup in Process Memory is not proof",
            pipeline,
        )
        self.assertIn(
            "execution shall not synthesize `DOCUMENT_ABSENCE`, `FALSE` or a Nonconformity from an empty lookup",
            pipeline,
        )
        self.assertIn(
            "the affected Criterion and shall be evaluated only under that Criterion's declared logic",
            pipeline,
        )
        self.assertIn(
            "including an independently established `FALSE`. Do not derive a Requirement-level result",
            pipeline,
        )
        self.assertIn(
            "Process Memory contracts do not define how the Phase 2 `DOCUMENT_STATE` values are represented",
            pipeline,
        )

    def test_existing_document_version_must_match_manifest(self):
        with self.assertRaises(ValueError):
            self.builder.inject_document_version(
                "DOCUMENT_VERSION: 9.9.9\n", "2.1.0"
            )

    def test_operational_report_exposes_only_short_global_release(self):
        operational, audit = self.reports.split("ANEXO TÉCNICO DE AUDITORIA", 1)
        self.assertIn("Base: SSCI-Habite-se 5.30.0", operational)
        self.assertNotIn("SOURCE_COMMIT:", operational)
        self.assertIn(
            "Não exibir no relatório operacional SOURCE_COMMIT, DOCUMENT_SET",
            operational,
        )
        self.assertNotRegex(operational, r"SOURCE_COMMIT: [0-9a-f]{7,40}")
        self.assertNotIn("DOCUMENT_VERSION por documento carregado:", operational)
        for field in ("KNOWLEDGE_BASE_ID:", "KNOWLEDGE_BASE_VERSION:", "SOURCE_COMMIT:"):
            self.assertIn(field, audit)

    def test_correlation_disclosure_contract_is_exact_and_non_normative(self):
        notice = (
            "Foi utilizada correlação documental automática assistida por inteligência artificial, "
            "conforme política e calibração identificadas neste relatório. A validação normativa "
            "institucional deste mecanismo permanece pendente. A admissão automática não equivale "
            "à confirmação humana da correspondência nem comprova isoladamente o atendimento das "
            "exigências normativas."
        )
        normalized = re.sub(r"\s+", " ", self.reports)
        normalized_folded = normalized.casefold()
        self.assertIn(notice, normalized)
        self.assertIn("confiança calibrada", normalized_folded)
        self.assertIn("versão da política", normalized_folded)
        self.assertIn("versão da calibração", normalized_folded)
        self.assertIn("referências rastreáveis às evidências utilizadas", normalized_folded)
        self.assertIn("proveniência disponível", normalized_folded)
        self.assertIn("não recalcular a correlação", normalized_folded)

    def test_rde_050_preserves_documentary_dates(self):
        rde = (KB / "09_Especificacao_da_RDE.txt").read_text(encoding="utf-8")
        self.assertIn("RDE_SCHEMA_VERSION: 0.7.0", rde)
        self.assertIn("drt_scope_declaration_items", rde)
        self.assertRegex(rde, r"RDE 0\.5\.0 deverá possuir também `documentary_date_items`")
        date_items = re.sub(
            r"\s+", " ", rde.split("DOCUMENTARY DATE ITEMS", 1)[1].split(
                "Toda entidade deverá", 1
            )[0]
        )
        fields = (
            "date_item_id:",
            "product_record_id:",
            "date_label_text:",
            "date_text:",
            "source_document:",
            "source_text:",
            "provenance: (opcional)",
        )
        positions = [date_items.index(field) for field in fields]
        self.assertEqual(positions, sorted(positions))
        self.assertIn("possui exatamente:", date_items)
        self.assertIn("product_record_id` resolve somente para registro cujo tipo canônico seja exatamente `TEST_REPORT`", date_items)
        self.assertIn("`source_document` resolve para `TYPE DOCUMENT`", date_items)
        for sentence in (
            "Preservar ordem, itens múltiplos, valores conflitantes e provenances separadamente.",
            "Não escolher, priorizar ou deduplicar datas documentais.",
            "Não parafrasear, normalizar ou combinar ocorrências.",
            "não converte nem compara datas",
        ):
            self.assertIn(sentence, date_items)

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

    def test_phase_3a_sidecar_scope_reconciles_process_memory_guards(self):
        normalized = re.sub(r"\s+", " ", self.pipeline)
        phase_3a = normalized.split("# PHASE 3A", 1)[1].split(
            "END PHASE 3A", 1
        )[0]
        for forbidden in (
            "documentary_associations",
            "execute Requirements or Criteria",
            "EngineResult/PipelineResult",
        ):
            self.assertIn(forbidden, phase_3a)
        for required in (
            "separate, immutable correlation artifact",
            "shall not modify either source",
            "CurrentSubmissionContext",
            "PROTOCOL_IDENTIFIER",
            "REQUEST_DATE",
            "exact RDE references and digest",
            "exact presentation identity",
            "compiled contract",
            "frozen execution plan",
            "immutable execution view",
            "frozen policy",
            "threshold",
            "calibration id/version/hash",
            "validity",
            "policy and decision are frozen/versioned",
            "base_id",
            "binding_type",
            "score >= threshold",
            "adjustable only outside the Engine",
            "BLOCKED",
            "conflict",
            "ambiguity",
            "competing candidates",
            "insufficient provenance/integrity",
            "Human review is required",
            "No correlation decision causes PASS in isolation",
            "cannot create a rule, result, Requirement, Criterion or Nonconformity",
        ):
            self.assertIn(required, phase_3a)
        self.assertIn(
            "The initial inclusive threshold is `0.80` (`score >= threshold`) and is adjustable only outside the Engine.",
            phase_3a,
        )
        self.assertIn(
            "The policy and decision are frozen/versioned and the decision is immutable.",
            phase_3a,
        )
        self.assertIn(
            "Policy and calibration must be valid and applicable to `base_id` and `binding_type` before the decision; missing, invalid or inapplicable policy/calibration is `BLOCKED`.",
            phase_3a,
        )
        self.assertIn(
            "The common correlation contract shall be calibrated independently for each Knowledge Base and binding type.",
            phase_3a,
        )
        self.assertIn(
            "Only an authenticated, read-only interface may expose an admitted correlation to the Engine.",
            phase_3a,
        )
        self.assertIn(
            "The interface shall bind the decision to the exact presentation identity, RDE digest, compiled contract, frozen execution plan and immutable execution view.",
            phase_3a,
        )
        self.assertIn(
            "The authenticated sidecar is limited to contextual documentary relation for the executor, separate, immutable and read-only",
            phase_3a,
        )
        self.assertIn(
            "its authentication covers presentation, RDE, contract, plan and view and it shall not alter facts, Process Memory or the RDE.",
            phase_3a,
        )
        self.assertNotIn(
            "Requirements, Criteria and Report generation shall consume Process Memory only.",
            normalized,
        )
        self.assertNotIn("Criteria shall consume Process Memory only.", normalized)
        self.assertIn(
            "ARCHITECTURAL_CONFLICT=RESOLVED_BY_EXPLICIT_USER_DECISION",
            normalized,
        )
        self.assertIn(
            "Requirements shall consume documentary facts from Process Memory only",
            normalized,
        )
        self.assertIn(
            "only for a declared DRT-to-product/coverage relation predicate",
            normalized,
        )
        self.assertIn("never as an attribute or documentary fact", normalized)
        self.assertIn(
            "Phase 8 may consume authenticated frozen metadata from either artifact only for disclosure",
            normalized,
        )
        self.assertIn("shall not recompute correlation", normalized)
        self.assertIn("relation-only input", normalized)
        self.assertIn("never as an attribute or documentary fact", normalized)
        self.assertIn(
            "Applicability and all other phases shall consume Process Memory only",
            normalized,
        )
        self.assertIn(
            "ARCHITECTURAL_CONFLICT=RESOLVED_BY_EXPLICIT_USER_DECISION",
            normalized,
        )

    def test_phase_8_requires_frozen_authenticated_disclosure_projection(self):
        phase_8 = self.pipeline.split("# PHASE 8", 1)[1].split(
            "# EXECUTION RULES", 1
        )[0]
        normalized = re.sub(r"\s+", " ", phase_8)
        self.assertIn("authenticated", normalized)
        self.assertIn("immutable", normalized)
        self.assertIn("read-only", normalized)
        self.assertIn("frozen DRT-product correlation disclosure projection", normalized)
        self.assertIn("only the immutable consolidated results", normalized)
        self.assertIn("immutable Phase 6A operational projection", normalized)
        self.assertIn("linked to the exact presentation and RDE", normalized)
        self.assertIn("fields enumerated by 06_reports", normalized)
        for field in (
            "DRT reference",
            "product reference",
            "automatic origin",
            "calibrated confidence",
            "policy and calibration versions",
            "evidence/provenance references",
            "caveats",
            "institutional status",
        ):
            self.assertIn(field, normalized)
        self.assertIn("it shall only disclose these frozen projections", normalized)
        self.assertIn("shall never consume either artifact wholesale", normalized)
        self.assertIn("receive proposals, extracted facts, or any capability to alter the decision", normalized)
        self.assertIn("shall not recompute correlation", normalized)
        self.assertIn("frozen signature-verification disclosure projection", normalized)
        for field in (
            "exact document reference and digest",
            "automatic or human origin",
            "method and verifier/policy versions",
            "cryptographic-integrity outcome",
            "signer identity when available",
            "certificate-chain/trust and revocation status, including UNKNOWN",
            "human reviewer, date, method, evidence and decision",
            "cryptographically intact signature",
            "fully validated signature",
        ):
            self.assertIn(field, normalized)
        self.assertIn("shall not recompute correlation or signature verification", normalized)
        self.assertIn("never consume either artifact wholesale", normalized)

    def test_all_signed_criterion_dependencies_are_listed_and_classified(self):
        assert_ids = {
            "T1_DRT_SIGNED",
            "T4_DRT_SIGNED",
            "T1_CONFORMITY_REPORT_SIGNED",
        }
        validate_ids = {
            "T4_IN07_COMMISSIONING",
            "T4_IN08_ESTANQUEIDADE",
            "T4_IN09_CHECKLIST",
            "T4_IN09_TEST_REPORT",
            "T4_IN10_COMMISSIONING",
            "T4_IN12_COMMISSIONING",
            "T4_IN15_COMMISSIONING",
            "T4_IN18_CMAR",
        }
        self.assertEqual(len(assert_ids) + len(validate_ids), 11)

        table_1_and_4 = self.table_1 + "\n" + self.table_4
        for criterion_id in assert_ids:
            match = re.search(
                rf"(?ms)^CRITERION {re.escape(criterion_id)}\n(.*?)(?=^END\s*$)",
                table_1_and_4,
            )
            self.assertIsNotNone(match, criterion_id)
            self.assertIn("SIGNED", match.group(1), criterion_id)

        signed_product_requirements = set()
        for match in re.finditer(
            r"(?ms)^REQUIREMENT (\S+)\n(.*?)(?=^END\s*$)", self.requirements
        ):
            body = match.group(2)
            if "VALIDATE TECHNICAL_PRODUCT_ATTRIBUTE" in body and re.search(
                r"(?m)^EVIDENCE_ATTRIBUTE SIGNED\s*$", body
            ):
                signed_product_requirements.add(match.group(1))

        linked_validation_ids = set()
        for criterion_id in validate_ids:
            match = re.search(
                rf"(?ms)^CRITERION {re.escape(criterion_id)}\n(.*?)(?=^END\s*$)",
                self.table_4,
            )
            self.assertIsNotNone(match, criterion_id)
            requirement_match = re.search(r"(?m)^(?:USES|REQUIREMENT) (\S+)$", match.group(1))
            self.assertIsNotNone(requirement_match, criterion_id)
            requirement_id = requirement_match.group(1)
            self.assertIn(requirement_id, signed_product_requirements, criterion_id)
            linked_validation_ids.add(criterion_id)

        inventory = re.sub(r"\s+", " ", self.coverage_inventory)
        for criterion_id in assert_ids | validate_ids:
            self.assertIn(criterion_id, inventory)
        self.assertIn("onze Criteria dependentes de", inventory)
        self.assertIn("dois ASSERTs de DRT", inventory)
        self.assertIn("um ASSERT de produto", inventory)
        self.assertIn("oito VALIDATEs de produto", inventory)

    def test_signature_receipt_is_created_after_extraction_and_admitted_only_by_frozen_binding(self):
        phase_2 = self.pipeline.split("# PHASE 2", 1)[1].split(
            "# PHASE 2A", 1
        )[0]
        phase_2a = self.pipeline.split("# PHASE 2A", 1)[1].split(
            "# PHASE 3", 1
        )[0]
        phase_5 = self.pipeline.split("# PHASE 5", 1)[1].split(
            "# PHASE 6", 1
        )[0]
        phase_2_normalized = re.sub(r"\s+", " ", phase_2)
        phase_2a_normalized = re.sub(r"\s+", " ", phase_2a)
        phase_5_normalized = re.sub(r"\s+", " ", phase_5)

        self.assertIn(
            "Do not set a verified SIGNED determination or consume a verification receipt in EXTRACTION.",
            phase_2_normalized,
        )
        self.assertNotIn(
            "Consume a separate authenticated signature-verification artifact",
            phase_2_normalized,
        )
        self.assertIn("receipt is produced only in Phase 2A", phase_2_normalized)
        self.assertIn("authenticated, immutable artifact", phase_2a_normalized)
        self.assertIn("RDE identity/digest", phase_2a_normalized)
        self.assertIn("An unavailable check is UNKNOWN", phase_2a_normalized)
        self.assertIn("cryptographically intact", phase_2a_normalized)
        self.assertIn("project-pinned verifier key", phase_2a_normalized)
        self.assertIn("authority profile has been defined", phase_2a_normalized)
        self.assertIn("authenticate and bind all three identities/digests", phase_5_normalized)
        self.assertIn("compiled Knowledge Base, frozen plan", phase_5_normalized)
        self.assertIn("Human receipts remain audit context", phase_5_normalized)
        self.assertIn("SIGNED predicate remains MANUAL_REVIEW", phase_5_normalized)

    def test_signature_contract_never_mutates_rde_or_claims_human_crypto_validation(self):
        pipeline = re.sub(r"\s+", " ", self.pipeline)
        engine = re.sub(r"\s+", " ", self.engine)
        rde = re.sub(r"\s+", " ", (KB / "09_Especificacao_da_RDE.txt").read_text(encoding="utf-8"))
        self.assertIn("does not mutate the receipt", pipeline)
        self.assertIn("no binding mutates the receipt, RDE, view or plan", pipeline)
        self.assertIn("A HUMAN RECEIPT ALONE SHALL NOT BE TREATED AS CRYPTOGRAPHIC VERIFICATION", engine)
        self.assertIn("HUMAN RECEIPT IS AUDIT CONTEXT ONLY", engine)
        self.assertIn("Esse artefato não é parte da RDE", rde)

    def test_managerial_phase6_split_preserves_internal_pipeline_phase_numbers(self):
        plan = re.sub(r"\s+", " ", self.migration_plan)
        inventory = re.sub(r"\s+", " ", self.coverage_inventory)
        self.assertIn("Fase 6A — núcleo e contratos", plan)
        self.assertIn("não exige, por si só, cobertura dos 29 Criteria produtivos", plan)
        self.assertIn("Fase 6B — integrações e evidências", plan)
        self.assertIn("APIs de conselhos ou de assinatura comercial não são dependência obrigatória", plan)
        self.assertIn("# PHASE 6A\n# IRV OPERATIONAL PROJECTION", self.pipeline)
        self.assertIn("Cobertos integralmente | 10", inventory)
        self.assertIn("Pendentes de cobertura integral | 19", inventory)
        self.assertIn("não é fechamento da Fase 6 nem promoção operacional", inventory)

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
        self.assertEqual(
            unit_keys("REQ_IN19_APPLICABILITY_REVIEW"),
            [
                "REQ_IN19_APPLICABILITY_REVIEW, "
                "T4_IN19_APPLICABILITY_REVIEW"
            ],
        )
        self.assertEqual(
            unit_keys("REQ_IN19_LEGACY_DOCUMENTATION"),
            [
                "REQ_IN19_LEGACY_DOCUMENTATION, "
                "T4_IN19_LEGACY_DOCUMENTATION"
            ],
        )
        self.assertEqual(
            unit_keys("REQ_IN19_REGIME_REVIEW"),
            ["REQ_IN19_REGIME_REVIEW, T4_IN19_REGIME_REVIEW"],
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
