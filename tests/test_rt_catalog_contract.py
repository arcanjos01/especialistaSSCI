from pathlib import Path
import re
import unittest
from tools.build_knowledge_base_release import _parse_rt_catalog_contract


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "docs" / "Anexo_A_Catalogo_Oficial_das_Responsabilidades_Tecnicas_Rev2.txt"
EXPECTED_IDS = {"RT-002", "RT-003", "RT-005", "RT-006", "RT-007", "RT-014", "RT-015"}
REQUIRED_FIELDS = {
    "IDENTIFIER",
    "INTERNAL_IDENTIFIER",
    "DESCRIPTION",
    "PURPOSE",
    "NATURE",
    "APPLICABLE_SMSCI",
    "QUALIFIED_PROFESSIONALS",
    "COMPATIBLE_ACTIVITIES",
    "ACCEPTED_DOCUMENTARY_EVIDENCE",
    "ASSOCIATED_TECHNICAL_PRODUCTS",
    "GENERAL_VALIDATION_CRITERIA",
    "NORMATIVE_SOURCES",
    "OBSERVATIONS",
}


class RtCatalogContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.text = CATALOG.read_text(encoding="utf-8")
        cls.entries = {
            match.group(1): match.group(2)
            for match in re.finditer(
                r"^### (RT-\d+)\s*\n(.*?)(?=^### RT-|\Z)",
                cls.text,
                re.MULTILINE | re.DOTALL,
            )
        }

    def test_catalog_ids_are_internal_and_expected(self):
        self.assertEqual(set(self.entries), EXPECTED_IDS)
        self.assertIn("Não são códigos oficiais atribuídos pelo", self.text)
        for identifier, entry in self.entries.items():
            self.assertIn(f"IDENTIFIER: {identifier}", entry)
            self.assertIn("INTERNAL_IDENTIFIER: true", entry)

    def test_each_entry_has_all_fields_and_sources(self):
        for identifier, entry in self.entries.items():
            fields = set(re.findall(r"^([A-Z_]+):", entry, re.MULTILINE))
            self.assertTrue(REQUIRED_FIELDS <= fields, f"{identifier}: {REQUIRED_FIELDS - fields}")
            self.assertIn("NORMATIVE_SOURCES:", entry)

    def test_documentary_responsibility_type_is_part_of_formal_schema_and_source_map(self):
        self.assertIn(
            "DRT_RESPONSIBILITY_TYPE (quando houver formalização documental explícita)",
            self.text,
        )
        self.assertIn(
            "DRT_RESPONSIBILITY_TYPE\n    Token canônico de máquina",
            self.text,
        )
        rt002 = self.entries["RT-002"]
        self.assertIn(
            "- DRT_RESPONSIBILITY_TYPE: EXECUCAO é DERIVED_BY_DIRECT_FORMALIZATION",
            rt002,
        )
        self.assertIn("IN 01 Parte 1,\n  art. 108, III", rt002)

    def test_rt002_exposes_only_the_authorized_documentary_responsibility_type(self):
        self.assertRegex(
            self.entries["RT-002"],
            r"(?m)^DRT_RESPONSIBILITY_TYPE: EXECUCAO$",
        )
        for identifier, entry in self.entries.items():
            if identifier != "RT-002":
                self.assertNotIn("DRT_RESPONSIBILITY_TYPE:", entry)

    def test_rt002_machine_activity_literal_is_explicit_and_exact(self):
        rt002 = self.entries["RT-002"]
        self.assertRegex(rt002, r'(?m)^MACHINE_COMPATIBLE_ACTIVITY_LITERALS: \["EXECUÇÃO"\]$')
        self.assertIn("MACHINE_COMPATIBLE_ACTIVITY_LITERALS", rt002.split("NORMATIVE_SOURCES:", 1)[1])
        for identifier, entry in self.entries.items():
            if identifier != "RT-002":
                self.assertNotIn("MACHINE_COMPATIBLE_ACTIVITY_LITERALS:", entry)

    def test_machine_activity_literal_contract_rejects_malformed_or_unsupported_data(self):
        malformed = self.text.replace(
            'MACHINE_COMPATIBLE_ACTIVITY_LITERALS: ["EXECUÇÃO"]',
            'MACHINE_COMPATIBLE_ACTIVITY_LITERALS: EXECUÇÃO',
            1,
        )
        with self.assertRaisesRegex(ValueError, "array JSON"):
            _parse_rt_catalog_contract(malformed)

        substring_only = self.text.replace(
            'MACHINE_COMPATIBLE_ACTIVITY_LITERALS: ["EXECUÇÃO"]',
            'MACHINE_COMPATIBLE_ACTIVITY_LITERALS: ["EXECUÇÃO DECLARADA"]',
            1,
        )
        with self.assertRaisesRegex(ValueError, "correspondência exata"):
            _parse_rt_catalog_contract(substring_only)

        missing_source = self.text.replace(
            "  MACHINE_COMPATIBLE_ACTIVITY_LITERALS:\n",
            "  COMPATIBLE_ACTIVITIES:\n",
            1,
        )
        with self.assertRaisesRegex(ValueError, "sem source map"):
            _parse_rt_catalog_contract(missing_source)

    def test_execution_and_regularization_are_separate_routes(self):
        for identifier in ("RT-002", "RT-003"):
            entry = " ".join(self.entries[identifier].split())
            self.assertIn("NATURE: EXECUÇÃO", entry)
            self.assertIn("CONDITIONAL_SUBSTITUTE_ACTIVITY: REGULARIZAÇÃO", entry)
            self.assertIn("art. 108, § 6º", entry)
            self.assertIn("laudo de vistoria", entry)
        self.assertNotIn("EXECUCAO OR REGULARIZACAO", self.text)

    def test_removed_unresolved_requirement_mappings_are_not_reintroduced(self):
        normalized = {key: " ".join(value.split()) for key, value in self.entries.items()}
        self.assertNotIn("CURRENT_REQUIREMENT_MAPPINGS", normalized["RT-007"])
        self.assertNotIn("CURRENT_REQUIREMENT_MAPPING", normalized["RT-015"])
        self.assertIn("mappings foram retirados dos Requirements correntes", normalized["RT-007"])
        self.assertIn("REQ_IN09_CHECKLIST -> RT-015 foi retirado", normalized["RT-015"])
        self.assertIn("UNRESOLVED_ATTRIBUTE RESPONSIBILITY_RELATION_TO_RT006", normalized["RT-005"])
        self.assertIn("UNRESOLVED_ATTRIBUTE RESPONSIBILITY_RELATION_TO_RT005", normalized["RT-006"])

    def test_in09_inspection_items_preserve_only_express_condition(self):
        entry = " ".join(self.entries["RT-005"].split())
        self.assertIn("itens a–g", entry)
        self.assertIn("mecanismos automáticos de fechamento somente se previstos", entry)
        self.assertNotIn("itens a–h do art. 122, II, quando aplicáveis", entry)

    def test_gas_evidence_accepts_report_or_test(self):
        entry = " ".join(self.entries["RT-006"].split())
        self.assertIn("Laudo ou ensaio de estanqueidade", entry)

    def test_shp_commissioning_agent_is_system_specific(self):
        entry = " ".join(self.entries["RT-014"].split())
        self.assertIn("execução/manutenção ao SHP (IRV Tabela 4, item IN07)", entry)
        self.assertIn("execução/manutenção conforme IN 15, art. 30", entry)


if __name__ == "__main__":
    unittest.main()
