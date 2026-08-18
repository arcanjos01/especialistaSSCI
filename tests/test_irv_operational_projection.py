import re
import shlex
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "knowledge-base"
NONCONFORMITIES = (KB / "05_nonconformities.txt").read_text()
REPORTS = (KB / "06_reports.txt").read_text()
PIPELINE = (KB / "08_execution_pipeline.txt").read_text()
TABLE1 = (KB / "03_table1.txt").read_text()
TABLE4 = (KB / "04_table4.txt").read_text()
REQUIREMENTS = (KB / "02_requirements.txt").read_text()


def parse_nonconformities(text):
    records = {}
    current = None
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if line.startswith("NONCONFORMITY "):
            current = line.split(maxsplit=1)[1]
            records[current] = {}
        elif current and line == "END":
            current = None
        elif current and line and not line.startswith("#"):
            key, _, raw_value = line.partition(" ")
            if raw_value:
                values = shlex.split(raw_value)
                records[current][key] = values[0] if len(values) == 1 else tuple(values)
    return records


def fail_references(*texts):
    return [
        match.group(1)
        for text in texts
        for match in re.finditer(r"^FAIL (NC_\S+)$", text, re.MULTILINE)
    ]


def project(failed_ids, descriptions=None):
    descriptions = descriptions or {}
    pending = []
    human = []
    for nc_id in failed_ids:
        record = CATALOG[nc_id]
        if not {"IRV_TABLE", "IRV_CRITERION", "IRV_CAUSE"} <= record.keys():
            human.append(nc_id)
            continue
        description = descriptions.get(nc_id, "Não necessário.")
        if len(description) > 500:
            raise ValueError("DESCRIPTION excede 500 caracteres")
        prohibited_duplicates = {record["IRV_CRITERION"], record["IRV_CAUSE"]}
        if record.get("IRV_SUBCAUSE"):
            prohibited_duplicates.add(record["IRV_SUBCAUSE"])
        if any(value in description for value in prohibited_duplicates):
            raise ValueError("DESCRIPTION não pode repetir a seleção IRV")
        subcause = record.get("IRV_SUBCAUSE")
        pending.append(
            {
                "item": record["IRV_CRITERION"],
                "cause": record["IRV_CAUSE"],
                "subcause": subcause,
                "selection": subcause or record["IRV_CAUSE"],
                "description": description,
            }
        )
    return pending, human


def operational_status(fail, manual_review):
    if fail > 0:
        return "COM PENDÊNCIAS"
    if manual_review > 0:
        return "NECESSITA ANÁLISE HUMANA"
    return "SEM PENDÊNCIAS DOCUMENTAIS"


def validate_counters(executed, passed, failed, not_applicable, manual_review):
    if executed != passed + failed + not_applicable + manual_review:
        return "REPORT_COUNTER_INCONSISTENCY"
    return None


CATALOG = parse_nonconformities(NONCONFORMITIES)
ACTIONABLE = fail_references(TABLE1, TABLE4)
NON_IRV_EXCEPTIONS = {"NC_T1_009", "NC_T4_019"}

EXPECTED = {
    "NC_T1_001": ("1", "Documentos a serem apresentados conforme o artigo 108 da IN 1, parte 1", "É necessário apresentar o(s) seguinte (s) documento (s) conforme previsto no artigo 108 da IN 01, parte 1:"),
    "NC_T1_002": ("1", "DRT de execução dos SMSCI previstos no PPCI", "É necessário apresentar DRT de execução de todos os SMSCI executados na edificação, conforme o PPCI aprovado: (indicar os DRT inexistentes)."),
    "NC_T1_003": ("1", "Documentos a serem apresentados conforme o artigo 108 da IN 1, parte 1", "É necessário apresentar o(s) seguinte (s) documento (s) conforme previsto no artigo 108 da IN 01, parte 1:"),
    "NC_T1_004": ("1", "Autenticidade e validade do(s) DRT.", "DRT sem comprovação de autenticidade/validade:"),
    "NC_T1_005": ("1", "Autenticidade e validade do(s) DRT.", "DRT sem comprovação de autenticidade/validade:"),
    "NC_T1_006_RI": ("1", "Correto registro das informações básicas no(s) DRT.", "As seguintes informações não constam no DRT ou contém inconsistências: (Indicar a informação inexistente)"),
    "NC_T1_006_RT": ("1", "Correto registro das informações básicas no(s) DRT.", "As seguintes informações não constam no DRT ou contém inconsistências: (Indicar a informação inexistente)"),
    "NC_T1_006_ADDRESS": ("1", "Correto registro das informações básicas no(s) DRT.", "As seguintes informações não constam no DRT ou contém inconsistências: (Indicar a informação inexistente)"),
    "NC_T1_006_AREA": ("1", "Correto registro das informações básicas no(s) DRT.", "As seguintes informações não constam no DRT ou contém inconsistências: (Indicar a informação inexistente)"),
    "NC_T1_008": ("1", "Correto registro das informações técnicas no(s) DRT.", 'A atividade descrita no DRT não corresponde à "Execução".'),
    "NC_T4_001": ("4", "IN 7 - Relatório de Comissionamento do SHP", "É necessário apresentar o relatório de comissionamento do sistema, conforme o artigo 106 da IN 7, com a emissão do respectivo DRT."),
    "NC_T4_002": ("4", "IN 8 - Laudo ou ensaio de estanqueidade", "Apresentar laudo ou ensaio de estanqueidade da rede de gás com respectivo DRT, conforme o artigo 95 da IN 8."),
    "NC_T4_003": ("4", "IN 8 - Cópia do manual do proprietário", "Apresentar manual do proprietário contendo as instruções para instalação dos aparelhos a gás, conforme o artigo 80 da IN 8."),
    "NC_T4_004": ("4", "IN 9 - Escada Pressurizada", "É necessário apresentar o DRT de execução e DRT de vistoria/ensaio do sistema de pressurização, gradiente de pressão, alarme e detecção de incêndio constando o código ou descrição específica para escadas pressurizadas e de gradiente de pressão, conforme o artigo 122 da IN 09."),
    "NC_T4_005": ("4", "IN 9 - Escada Pressurizada", "É necessário apresentar em complemento ao DRT de vistoria/ensaio, laudo de acordo com os parâmetros do item 7 da NBR 14880 e nos termos da IN 12 e do item 8 da NBR 17240, devendo ser realizada inspeção também nos itens elencados no inciso II do artigo 122 da IN 09."),
    "NC_T4_006": ("4", "IN 9 - Escada Pressurizada", "É necessário apresentar o manual de operação e manutenção do sistema de pressurização e de gradiente de pressão, conforme o artigo 122 da IN 09."),
    "NC_T4_007": ("4", "IN 9 - Escada Pressurizada", "É necessário apresentar cópia da lista de verificações dos procedimentos de manutenção, a qual deve ser fornecida aos proprietários do edifício ao final das obras, pelos responsáveis da instalação do sistema, com manuais em português, conforme o artigo 122 da IN 09."),
    "NC_T4_008": ("4", "IN 10 - Relatório de comissionamento do Controle de Fumaça", "Apresentar relatório de comissionamento do sistema de controle de fumaça (quando o sistema for mecânico) a ser elaborado por uma equipe ou profissional independente, sem vínculo técnico com o projeto ou execução acompanhado do respectivo DRT, conforme previsto no artigo 41 da IN 10."),
    "NC_T4_009": ("4", "IN 12 - Relatório de comissionamento do Sistema de Detecção e Alarme de Incêndio", "Apresentar relatório de comissionamento do SDAI atendendo aos parâmetros do item 8 da NBR 17240, conforme previsto no artigo 47 da IN 12, com a emissão do respectivo DRT"),
    "NC_T4_010": ("4", "IN 15 - Relatório de comissionamento para o Sistema de Chuveiros Automáticos", "Apresentar relatório de comissionamento do sistema de chuveiros automáticos conforme previsto no artigo 30 da IN 15, com a emissão do respectivo DRT."),
    "NC_T4_011": ("4", "IN 18 - Declaração de cumprimento dos requisitos de CMAR", "Apresentar declaração do RT informando o atendimento pleno dos requisitos de CMAR previstos na IN 18, conforme o artigo 14 da IN 18."),
    "NC_T4_012": ("4", "IN 19 - DRT das instalações elétricas de baixa tensão", "Apresentar DRT de execução da instalação elétrica de baixa tensão;"),
    "NC_T4_013": ("4", "IN 19 - DRT das instalações elétricas de baixa tensão", "Apresentar DRT de execução do aterramento da instalação elétrica de baixa tensão;"),
    "NC_T4_014": ("4", "IN 19 - DRT das instalações elétricas de baixa tensão", "Apresentar DRT de verificação final da instalação elétrica de baixa tensão."),
    "NC_T4_015": ("4", "IN 19 - DRT das instalações elétricas de baixa tensão", "Apresentar DRT de manutenção das instalações elétricas de baixa tensão, emitido nos últimos 5 anos; ou reforma das instalações elétricas de baixa tensão, emitido nos últimos 10 anos."),
    "NC_T4_016_01": ("4", "IN 34 - Para ocupação M-5: DRT de execução dos seguintes sistemas: dispositivos de proteção contra explosão, controle de poeira, sensor de calor, proteção contra descargas atmosféricas", "Apresentar DRT de execução dos dispositivos contra explosão."),
    "NC_T4_016_02": ("4", "IN 34 - Para ocupação M-5: DRT de execução dos seguintes sistemas: dispositivos de proteção contra explosão, controle de poeira, sensor de calor, proteção contra descargas atmosféricas", "Apresentar DRT de execução do sistema de controle de poeira."),
    "NC_T4_016_03": ("4", "IN 34 - Para ocupação M-5: DRT de execução dos seguintes sistemas: dispositivos de proteção contra explosão, controle de poeira, sensor de calor, proteção contra descargas atmosféricas", "Apresentar DRT de execução dos sensores de calor."),
    "NC_T4_016_04": ("4", "IN 34 - Para ocupação M-5: DRT de execução dos seguintes sistemas: dispositivos de proteção contra explosão, controle de poeira, sensor de calor, proteção contra descargas atmosféricas", "Apresentar DRT de execução do sistema contra descargas atmosféricas."),
    "NC_T4_017": ("1", "Autenticidade e validade do(s) DRT.", "DRT sem comprovação de autenticidade/validade:"),
    "NC_T4_018": ("1", "Autenticidade e validade do(s) DRT.", "DRT sem comprovação de autenticidade/validade:"),
}


class IRVOperationalProjectionContractTests(unittest.TestCase):
    def test_a_all_declared_irv_mappings_match_the_contract_inventory(self):
        mapped = {
            nc_id: (record.get("IRV_TABLE"), record.get("IRV_CRITERION"), record.get("IRV_CAUSE"))
            for nc_id, record in CATALOG.items()
            if "IRV_TABLE" in record
        }
        self.assertEqual(mapped, EXPECTED)
        for nc_id in EXPECTED:
            self.assertEqual(CATALOG[nc_id]["DESCRIPTION_POLICY"], "MINIMAL_IF_NEEDED")

    def test_b_actionable_coverage_and_explicit_non_irv_exceptions(self):
        self.assertEqual(len(ACTIONABLE), 32)
        self.assertEqual(len(set(ACTIONABLE)), 32)
        mapped_actionable = {nc_id for nc_id in ACTIONABLE if "IRV_TABLE" in CATALOG[nc_id]}
        self.assertEqual(len(mapped_actionable), 30)
        self.assertEqual(set(ACTIONABLE) - mapped_actionable, NON_IRV_EXCEPTIONS)
        self.assertIn("fonte CONFEA_CREA", NONCONFORMITIES)
        self.assertIn("Nenhum texto aproximado deve ser criado", NONCONFORMITIES)

    def test_c_in8_produces_two_distinct_pending_entries(self):
        pending, human = project(["NC_T4_002", "NC_T4_003"])
        self.assertEqual(human, [])
        self.assertEqual(len(pending), 2)
        self.assertEqual(pending[0]["item"], "IN 8 - Laudo ou ensaio de estanqueidade")
        self.assertEqual(pending[1]["item"], "IN 8 - Cópia do manual do proprietário")
        self.assertNotEqual(pending[0]["cause"], pending[1]["cause"])
        self.assertEqual({entry["description"] for entry in pending}, {"Não necessário."})

    def test_d_in19_keeps_direct_causes_and_pending_entries_distinct(self):
        ids = ["NC_T4_012", "NC_T4_013", "NC_T4_014", "NC_T4_015"]
        pending, human = project(ids)
        self.assertEqual(human, [])
        self.assertEqual(len(pending), 4)
        self.assertEqual(len({entry["item"] for entry in pending}), 1)
        self.assertEqual(len({entry["selection"] for entry in pending}), 4)
        self.assertTrue(all(entry["subcause"] is None for entry in pending))
        self.assertIn("manutenção das instalações elétricas", CATALOG["NC_T4_015"]["IRV_CAUSE"])
        self.assertIn("reforma das instalações elétricas", CATALOG["NC_T4_015"]["IRV_CAUSE"])

    def test_e_in1_basic_data_preserves_parent_and_four_subcauses(self):
        ids = ["NC_T1_006_RI", "NC_T1_006_RT", "NC_T1_006_ADDRESS", "NC_T1_006_AREA"]
        parent = "As seguintes informações não constam no DRT ou contém inconsistências: (Indicar a informação inexistente)"
        self.assertEqual({CATALOG[nc_id]["IRV_CAUSE"] for nc_id in ids}, {parent})
        self.assertEqual(
            [CATALOG[nc_id]["IRV_SUBCAUSE"] for nc_id in ids],
            ["Nome do RI", "Nome do RT", "Endereço do Imóvel", "Área do Imóvel"],
        )
        pending, human = project(ids)
        self.assertEqual(human, [])
        self.assertEqual(len({entry["selection"] for entry in pending}), 4)
        self.assertTrue(all(entry["subcause"] == entry["selection"] for entry in pending))

    def test_e1_article_108_and_authenticity_preserve_subcause_leaves(self):
        article_ids = ["NC_T1_001", "NC_T1_003"]
        article_parent = "É necessário apresentar o(s) seguinte (s) documento (s) conforme previsto no artigo 108 da IN 01, parte 1:"
        self.assertEqual({CATALOG[nc_id]["IRV_CAUSE"] for nc_id in article_ids}, {article_parent})
        self.assertEqual(
            {CATALOG[nc_id]["IRV_SUBCAUSE"] for nc_id in article_ids},
            {"DRT de execução dos sistemas e medidas de SCI previstos no PPCI.", "Relatório de conformidade dos SMSCI (Anexo I da IN 01, parte 1)."},
        )
        authenticity_ids = ["NC_T1_004", "NC_T1_005", "NC_T4_017", "NC_T4_018"]
        self.assertEqual({CATALOG[nc_id]["IRV_CAUSE"] for nc_id in authenticity_ids}, {"DRT sem comprovação de autenticidade/validade:"})
        self.assertEqual(
            {CATALOG[nc_id]["IRV_SUBCAUSE"] for nc_id in authenticity_ids},
            {"Não possui registro de emissão no conselho de classe (rascunho, etc).", "Não possui assinatura digital do RT ou certificação digital pelo conselho de classe."},
        )

    def test_e2_mapping_cardinality_is_ten_subcauses_and_twenty_one_direct_causes(self):
        mapped = {nc_id: record for nc_id, record in CATALOG.items() if "IRV_TABLE" in record}
        subcause_ids = {nc_id for nc_id, record in mapped.items() if "IRV_SUBCAUSE" in record}
        self.assertEqual(len(mapped), 31)
        self.assertEqual(len(subcause_ids), 10)
        self.assertEqual(len(set(mapped) - subcause_ids), 21)
        self.assertTrue(all("IRV_SUBCAUSE" not in mapped[nc_id] for nc_id in set(mapped) - subcause_ids))

    def test_e3_direct_cause_coverage_has_no_artificial_subcause(self):
        direct_ids = {
            "NC_T1_008",
            "NC_T4_001",
            "NC_T4_004", "NC_T4_005", "NC_T4_006", "NC_T4_007",
            "NC_T4_008", "NC_T4_009", "NC_T4_010", "NC_T4_011",
            "NC_T4_016_01", "NC_T4_016_02", "NC_T4_016_03",
            "NC_T4_016_04",
        }
        self.assertEqual(
            CATALOG["NC_T1_008"]["IRV_CAUSE"],
            'A atividade descrita no DRT não corresponde à "Execução".',
        )
        for nc_id in direct_ids:
            self.assertIn("IRV_CAUSE", CATALOG[nc_id])
            self.assertNotIn("IRV_SUBCAUSE", CATALOG[nc_id])

    def test_f_description_is_absent_for_simple_document_absence(self):
        pending, _ = project(["NC_T4_002", "NC_T4_003", "NC_T4_013"])
        self.assertTrue(all(entry["description"] == "Não necessário." for entry in pending))

    def test_g_concrete_divergence_uses_only_relevant_documentary_values(self):
        description = "A DRT informa CEP 88845-000 e não contém nº 2; o processo registra CEP 88800-000 e nº 2."
        pending, _ = project(["NC_T1_006_ADDRESS"], {"NC_T1_006_ADDRESS": description})
        self.assertEqual(pending[0]["description"], description)
        self.assertIn("88845-000", description)
        self.assertIn("88800-000", description)
        self.assertLessEqual(len(description), 180)

    def test_h_wrong_file_in_drt_field_gets_a_minimal_factual_description(self):
        description = "Arquivo anexado no campo DRT: declaração sem identificação ART, RRT ou TRT."
        pending, _ = project(["NC_T1_001"], {"NC_T1_001": description})
        self.assertEqual(pending[0]["subcause"], "DRT de execução dos sistemas e medidas de SCI previstos no PPCI.")
        self.assertEqual(pending[0]["description"], description)
        self.assertLessEqual(len(description), 180)

    def test_i_description_hard_limit_and_non_duplication(self):
        accepted_over_preference = "x" * 181
        pending, _ = project(["NC_T1_006_ADDRESS"], {"NC_T1_006_ADDRESS": accepted_over_preference})
        self.assertEqual(len(pending[0]["description"]), 181)
        project(["NC_T1_006_ADDRESS"], {"NC_T1_006_ADDRESS": "x" * 500})
        with self.assertRaises(ValueError):
            project(["NC_T1_006_ADDRESS"], {"NC_T1_006_ADDRESS": "x" * 501})
        with self.assertRaises(ValueError):
            project(["NC_T4_002"], {"NC_T4_002": CATALOG["NC_T4_002"]["IRV_CAUSE"]})
        with self.assertRaises(ValueError):
            project(["NC_T1_006_ADDRESS"], {
                "NC_T1_006_ADDRESS": CATALOG["NC_T1_006_ADDRESS"]["IRV_SUBCAUSE"],
            })
        with self.assertRaises(ValueError):
            project(["NC_T1_006_ADDRESS"], {
                "NC_T1_006_ADDRESS": (
                    "Divergência: "
                    + CATALOG["NC_T1_006_ADDRESS"]["IRV_SUBCAUSE"]
                ),
            })
        self.assertIn("180 is a preference, not a validity limit", PIPELINE)
        self.assertIn("limite técnico absoluto de 500 caracteres", REPORTS)

    def test_j_counter_inconsistency_is_audit_only_and_non_blocking(self):
        self.assertIsNone(validate_counters(10, 4, 3, 2, 1))
        self.assertEqual(
            validate_counters(9, 4, 3, 2, 1),
            "REPORT_COUNTER_INCONSISTENCY",
        )
        pending, human = project(["NC_T4_012", "NC_T4_013"])
        self.assertEqual(len(pending), 2)
        self.assertEqual(human, [])
        self.assertIn(
            "VERIFICATIONS_EXECUTED = PASS + FAIL + NOT_APPLICABLE + MANUAL_REVIEW",
            REPORTS,
        )
        self.assertIn("Continue operational report\ngeneration", PIPELINE)
        self.assertIn("omita os totais inválidos", REPORTS)

    def test_j1_t1_smsci_for_each_produces_one_pending_with_aggregated_evidence(self):
        self.assertIn(
            "Each selected Criterion shall produce exactly one result",
            PIPELINE,
        )
        self.assertIn("FOR_EACH is a structural aggregation", PIPELINE)
        self.assertIn(
            "Repeated failing instances with\nthe same Nonconformity",
            PIPELINE,
        )
        description = "A DRT apresentada não contempla IEL, IGC e SE."
        pending, human = project(
            ["NC_T1_002"],
            {"NC_T1_002": description},
        )
        self.assertEqual(human, [])
        self.assertEqual(len(pending), 1)
        self.assertEqual(pending[0]["description"], description)
        self.assertEqual(
            pending[0]["selection"],
            CATALOG["NC_T1_002"]["IRV_CAUSE"],
        )

    def test_k_operational_status_is_neutral_and_deterministic(self):
        self.assertEqual(operational_status(1, 0), "COM PENDÊNCIAS")
        self.assertEqual(operational_status(0, 1), "NECESSITA ANÁLISE HUMANA")
        self.assertEqual(operational_status(0, 0), "SEM PENDÊNCIAS DOCUMENTAIS")
        operational = REPORTS.split("ANEXO TÉCNICO DE AUDITORIA", 1)[0]
        for forbidden in ("STATUS: APROVADO", "STATUS: REPROVADO", "STATUS: INDEFERIDO"):
            self.assertNotIn(forbidden, operational)

    def test_l_non_irv_fail_is_preserved_for_human_treatment(self):
        pending, human = project(["NC_T1_009", "NC_T4_019", "NC_T4_002"])
        self.assertEqual(len(pending), 1)
        self.assertEqual(human, ["NC_T1_009", "NC_T4_019"])
        self.assertIn("do not convert the\nFAIL to MANUAL_REVIEW", PIPELINE)

    def test_m_report_and_pipeline_keep_projection_after_consolidation(self):
        self.assertIn("2. PENDÊNCIAS PARA LANÇAMENTO NO e-SCI", REPORTS)
        for label in ("ITEM DO CHECKLIST:", "CAUSA A SELECIONAR:", "SUBCAUSA A SELECIONAR:", "DESCREVER:", "EVIDÊNCIA:"):
            self.assertIn(label, REPORTS)
        self.assertLess(PIPELINE.index("# PHASE 6\n"), PIPELINE.index("# PHASE 6A\n"))
        self.assertLess(PIPELINE.index("# PHASE 6A\n"), PIPELINE.index("# PHASE 7\n"))
        self.assertIn("Do not group, deduplicate or suppress pending entries", PIPELINE)
        self.assertIn("TRATAMENTO HUMANO", REPORTS)
        self.assertNotIn("3. ITENS QUE NECESSITAM TRATAMENTO HUMANO", REPORTS)
        self.assertIn("IRV_SUBCAUSE when present, otherwise IRV_CAUSE", PIPELINE)
        sections = [
            "1. RESULTADO DA ANÁLISE",
            "2. PENDÊNCIAS PARA LANÇAMENTO NO e-SCI",
            "3. IDENTIFICAÇÃO DO PROCESSO",
            "4. DOCUMENTOS ANALISADOS",
            "5. RESULTADO RESUMIDO DAS VERIFICAÇÕES",
            "6. OBSERVAÇÕES",
            "7. RODAPÉ",
        ]
        positions = [REPORTS.index(section) for section in sections]
        self.assertEqual(positions, sorted(positions))

    def test_n_known_debts_remain_unresolved(self):
        self.assertIn("NC_T1_003_SIGNED", REQUIREMENTS)
        self.assertNotIn("NC_T1_003_SIGNED", CATALOG)
        self.assertIn("NC_T4_018", CATALOG)
        self.assertNotIn("NC_T4_018", ACTIONABLE)

    def test_o_base_inventory_and_protected_catalog_sizes_remain_current(self):
        expected_files = {
            "00_engine.txt", "01_entities.txt", "02_requirements.txt",
            "02a_applicability.txt", "03_table1.txt", "04_table4.txt",
            "05_nonconformities.txt", "06_reports.txt",
            "08_execution_pipeline.txt", "09_Especificacao_da_RDE.txt",
        }
        self.assertEqual({path.name for path in KB.glob("*.txt")}, expected_files)
        self.assertEqual(len(CATALOG), 33)
        self.assertEqual(len(re.findall(r"^CRITERION ", TABLE1, re.MULTILINE)), 12)
        self.assertEqual(len(re.findall(r"^CRITERION ", TABLE4, re.MULTILINE)), 22)


if __name__ == "__main__":
    unittest.main()
