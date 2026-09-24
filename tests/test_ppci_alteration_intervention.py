"""Contract probes for the optional PPCI-alteration workflow and scope view.

The Python helpers model the declared Gem/pipeline contract for regression
purposes; source-text assertions guard the actual operational instructions.
These are textual contract tests and do not prove runtime behavior of the Gem's
probabilistic LLM. They are not a second operational executor.
"""

from dataclasses import dataclass, field
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "knowledge-base"
ENTITIES = (KB / "01_entities.txt").read_text(encoding="utf-8")
APPLICABILITY = (KB / "02a_applicability.txt").read_text(encoding="utf-8")
REQUIREMENTS = (KB / "02_requirements.txt").read_text(encoding="utf-8")
NONCONFORMITIES = (KB / "05_nonconformities.txt").read_text(encoding="utf-8")
REPORTS = (KB / "06_reports.txt").read_text(encoding="utf-8")
RDE = (KB / "09_Especificacao_da_RDE.txt").read_text(encoding="utf-8")
PIPELINE = (KB / "08_execution_pipeline.txt").read_text(encoding="utf-8")
GEM = (ROOT / "instruções_gem.txt").read_text(encoding="utf-8")

RELATIONS = {
    "EXECUTED_IN_INTERVENTION",
    "MODIFIED_OR_RESIZED",
    "PREEXISTING_SYSTEM_AFFECTED",
    "PREEXISTING_SYSTEM_DECLARED_UNCHANGED",
}




def entity_block(entity_id):
    start = ENTITIES.index(f"ENTITY {entity_id}\n")
    end = ENTITIES.index("\nEND\n", start)
    return ENTITIES[start:end]


def t1_worklist_contract():
    return APPLICABILITY.split(
        "\nWORKLIST.SMSCI\n", 1
    )[1].split("PHASE 4C", 1)[0]

def official_map():
    section = APPLICABILITY.split(
        "OFFICIAL_ESCI_CODE -> CANONICAL_ENTITY", 1
    )[1]
    return dict(re.findall(r"(?m)^([A-Za-z0-9]+) -> (SMSCI_[A-Z0-9_]+)$", section))


def documentary_intervention_relation_facts(statements):
    """Preserve all traceable relation declarations, including conflicts."""
    return [
        dict(statement)
        for statement in statements
        if statement.get("individually_identified") is True
        and statement.get("source_document")
        and statement.get("source_location")
        and statement.get("relation") in RELATIONS
        and complete_smsci_target(statement) is not None
    ]


def complete_smsci_target(statement):
    """Resolve only an official code or an unambiguous whole-system name."""
    target_by_code = official_map()
    code = statement.get("official_esci_code")
    if code in target_by_code:
        return target_by_code[code]
    reference = " ".join(statement.get("smsci_reference_text", "").split()).casefold()
    if not reference:
        return None
    # These catalog aliases name a component or part, not the complete SMSCI.
    component_aliases = {
        "central_glp", "hidrante", "hidrantes", "rede_de_hidrantes",
    }
    for target in set(target_by_code.values()):
        block = entity_block(target)
        name_match = re.search(r"(?ms)^NAME\n\n(.*?)\n\nALIAS\n", block)
        if name_match:
            canonical_name = " ".join(name_match.group(1).split()).casefold()
            if reference == canonical_name:
                return target
        alias_match = re.search(r"(?ms)^ALIAS\n\n(.*?)\n\nEND$", block)
        if alias_match:
            aliases = {
                " ".join(alias.split()).casefold()
                for alias in alias_match.group(1).splitlines()
                if alias.strip()
            }
            if reference in aliases and reference not in component_aliases:
                return target
    return None


def explicit_intervention_relations(statements):
    """Create a relation view only when all declarations for a target agree."""
    grouped = {}
    for fact in documentary_intervention_relation_facts(statements):
        target = complete_smsci_target(fact)
        if target is not None:
            grouped.setdefault(target, set()).add(fact["relation"])
    return {
        target: next(iter(relations))
        for target, relations in grouped.items()
        if len(relations) == 1
    }


def normalized_text(text):
    return " ".join(text.split())


def gem_workflow_contract_violations(instructions):
    """Check the declared textual gate contract, not actual Gem execution."""
    try:
        gate = instructions.split("SUPPLEMENTAL DOCUMENT WORKFLOW", 1)[1].split(
            "\nOUTPUT\n", 1
        )[0]
        principles = instructions.split("EXECUTION PRINCIPLES", 1)[1].split(
            "\nPROHIBITED\n", 1
        )[0]
    except IndexError:
        return ["workflow or execution-principles section missing"]
    gate_text = normalized_text(gate)
    principles_text = normalized_text(principles)
    required_gate_fragments = [
        "fato documental direto indicar",
        "Habite-se de ampliação ou alteração de PPCI",
        "PPCI explicitamente apresentado como complementar ou substitutivo",
        "tipo de alteração formalmente declarado",
        "área acrescida documental e numericamente superior a zero",
        "Não pergunte em processo sem marcador documental direto.",
        "EXCEÇÃO ESTRITA AO FLUXO DE EXECUÇÃO",
        "A ausência do documento explicativo não é requisito, FAIL, Nonconformity, pendência e-SCI, indeferimento, Architectural Blocker nem evidência de alteração ou não alteração de qualquer SMSCI.",
        "Não registre a resposta do usuário na RDE, não a trate como evidência e não a use para concluir qualquer fato sobre SMSCI",
        "Não pergunte novamente nesta mesma execução.",
    ]
    violations = [
        f"Gem workflow contract fragment missing: {fragment}"
        for fragment in required_gate_fragments
        if normalized_text(fragment) not in gate_text
    ]
    question = normalized_text("""Foi apresentado ofício, memorial ou documento do responsável técnico
explicando a alteração do PPCI?

Se existir, anexe o documento para complementar a análise.
Se não existir, informe que o documento não existe e a análise continuará
com as informações disponíveis.""")
    if gate_text.count(question) != 1:
        violations.append("the exact optional-document question must occur once in the gate")
    if "A única exceção antecipada é a pergunta de workflow definida" not in principles_text:
        violations.append("execution principles must limit early output to the workflow question")
    if "só pode ser produzida depois da execução completa" not in principles_text:
        violations.append("analysis/report must remain after full execution")
    return violations


def t1_drt_worklist(process_smsci, alteration_facts, relations):
    """The prepared relation view does not filter DRT in this release."""
    return frozenset(process_smsci)


@dataclass
class SupplementalGate:
    """Conversation-only controller; its state is not a documentary fact."""
    responded_no: bool = False
    awaiting_response: bool = False
    waiting_for_attachment: bool = False
    interaction_events: list[str] = field(default_factory=list)

    def evaluate(self, alteration_detected, explanation_attached, answer=None):
        if not alteration_detected:
            return "CONTINUE"
        if explanation_attached:
            self.awaiting_response = False
            self.waiting_for_attachment = False
            return "CONTINUE"
        if self.responded_no:
            return "CONTINUE"
        if self.waiting_for_attachment:
            return "WAIT_FOR_ATTACHMENT"
        if self.awaiting_response:
            if answer == "NO":
                self.responded_no = True
                self.awaiting_response = False
                self.interaction_events.append("OPTIONAL_DOCUMENT_DECLINED")
                return "CONTINUE"
            if answer == "YES":
                self.awaiting_response = False
                self.waiting_for_attachment = True
                self.interaction_events.append("WAIT_FOR_OPTIONAL_ATTACHMENT")
                return "WAIT_FOR_ATTACHMENT"
            return "WAIT_FOR_RESPONSE"
        if answer == "NO":
            self.responded_no = True
            self.interaction_events.append("OPTIONAL_DOCUMENT_DECLINED")
            return "CONTINUE"
        if answer == "YES":
            self.waiting_for_attachment = True
            self.interaction_events.append("WAIT_FOR_OPTIONAL_ATTACHMENT")
            return "WAIT_FOR_ATTACHMENT"
        self.awaiting_response = True
        self.interaction_events.append("ASK_OPTIONAL_DOCUMENT")
        return "WAIT_FOR_RESPONSE"


def requirement_smsci_targets():
    records = {}
    current = None
    for line in REQUIREMENTS.splitlines():
        if line.startswith("REQUIREMENT "):
            current = line.split(maxsplit=1)[1]
            records[current] = None
        elif current and line.startswith("SMSCI "):
            records[current] = line.split(maxsplit=1)[1]
        elif current and line == "END":
            current = None
    return records


def table4_requirements(global_scope):
    metadata = requirement_smsci_targets()
    return {
        requirement for requirement, target in metadata.items()
        if requirement.startswith("REQ_IN")
        and target in global_scope
    }


class PPCIAlterationInterventionTests(unittest.TestCase):
    def setUp(self):
        self.global_scope = {"SMSCI_SHP", "SMSCI_GAS", "SMSCI_CMAR"}
        self.article_98 = {
            "requested_service_type": "HABITE-SE DE AMPLIAÇÃO",
            "ppci_submission_class": "COMPLEMENTARY",
            "prior_construction_certificate_matches_process": True,
            "expansion_effect_on_smsci":
                "NO_COMPROMISE_OR_RESIZING_DECLARED",
        }
        self.shp_changed = {
            "official_esci_code": "SHP",
            "relation": "MODIFIED_OR_RESIZED",
            "individually_identified": True,
            "source_document": "memorial-sintetico",
            "source_location": "p. 1, par. 2",
        }
        self.shp_unchanged = {
            "official_esci_code": "SHP",
            "relation": "PREEXISTING_SYSTEM_DECLARED_UNCHANGED",
            "individually_identified": True,
            "source_document": "memorial-sintetico",
            "source_location": "p. 1, par. 3",
        }

    def test_01_normal_process_neither_asks_nor_changes_global_requirements(self):
        gate = SupplementalGate()
        self.assertEqual(gate.evaluate(False, False), "CONTINUE")
        self.assertEqual(gate.interaction_events, [])
        self.assertEqual(t1_drt_worklist(self.global_scope, {}, {}), self.global_scope)
        self.assertIn("REQ_IN08_ESTANQUEIDADE", table4_requirements(self.global_scope))

    def test_02_alteration_with_explanation_continues_and_preserves_explicit_facts(self):
        gate = SupplementalGate()
        self.assertEqual(gate.evaluate(True, True), "CONTINUE")
        extracted = {
            "alteration_type": "AMPLIAÇÃO",
            "alteration_description": "Reorganização do setor de armazenamento e sala técnica.",
            "affected_areas": "Setor de armazenamento; sala técnica.",
            "previous_area_m2": 640.0,
            "added_area_m2": 48.0,
            "resulting_area_m2": 688.0,
        }
        self.assertEqual(extracted["added_area_m2"], 48.0)
        self.assertEqual(extracted["resulting_area_m2"], 688.0)
        self.assertEqual(explicit_intervention_relations([]), {})

    def test_03_missing_explanation_without_answer_waits_before_execution(self):
        gate = SupplementalGate()
        self.assertEqual(gate.evaluate(True, False), "WAIT_FOR_RESPONSE")
        self.assertTrue(gate.awaiting_response)
        self.assertFalse(gate.waiting_for_attachment)
        self.assertEqual(gate.interaction_events, ["ASK_OPTIONAL_DOCUMENT"])
        self.assertFalse(hasattr(gate, "rde_facts"))
        self.assertFalse(hasattr(gate, "normative_results"))

    def test_04_user_says_absent_and_analysis_continues_without_rde_evidence(self):
        gate = SupplementalGate()
        self.assertEqual(gate.evaluate(True, False), "WAIT_FOR_RESPONSE")
        self.assertTrue(gate.awaiting_response)
        self.assertFalse(gate.waiting_for_attachment)
        self.assertEqual(gate.evaluate(True, False, "NO"), "CONTINUE")
        self.assertEqual(
            gate.interaction_events,
            ["ASK_OPTIONAL_DOCUMENT", "OPTIONAL_DOCUMENT_DECLINED"],
        )
        self.assertEqual(gate.interaction_events.count("ASK_OPTIONAL_DOCUMENT"), 1)
        self.assertFalse(gate.awaiting_response)
        self.assertFalse(gate.waiting_for_attachment)
        self.assertFalse(hasattr(gate, "rde_facts"))
        self.assertEqual(table4_requirements(self.global_scope) & {"REQ_IN08_MANUAL"},
                         {"REQ_IN08_MANUAL"})

    def test_05_area_facts_without_smsci_leave_each_relation_undetermined(self):
        area_facts = {"affected_areas": "Área de lavação e área do gerador."}
        relations = explicit_intervention_relations([])
        self.assertTrue(area_facts["affected_areas"])
        self.assertEqual(relations, {})
        self.assertEqual(
            t1_drt_worklist(self.global_scope, self.article_98, relations),
            self.global_scope,
        )

    def test_06_explicit_shp_change_is_fact_and_keeps_its_drt_binding(self):
        relations = explicit_intervention_relations([self.shp_changed])
        self.assertEqual(relations, {"SMSCI_SHP": "MODIFIED_OR_RESIZED"})
        self.assertIn(
            "SMSCI_SHP",
            t1_drt_worklist(self.global_scope, self.article_98, relations),
        )

    def test_07_explicit_shp_unchanged_does_not_filter_drt_or_t4_this_release(self):
        relations = explicit_intervention_relations([self.shp_unchanged])
        self.assertEqual(
            relations["SMSCI_SHP"],
            "PREEXISTING_SYSTEM_DECLARED_UNCHANGED",
        )
        self.assertIn("SMSCI_SHP", self.global_scope)
        self.assertIn(
            "SMSCI_SHP",
            t1_drt_worklist(self.global_scope, {}, relations),
        )
        self.assertIn(
            "SMSCI_SHP",
            t1_drt_worklist(self.global_scope, self.article_98, relations),
        )
        self.assertIn("REQ_IN07_COMMISSIONING", table4_requirements(self.global_scope))

    def test_conflicting_traceable_statements_are_preserved_but_not_resolved(self):
        statements = [
            {**self.shp_changed, "statement_text": "SHP foi ampliado."},
            {**self.shp_unchanged, "statement_text": "SHP não foi alterado."},
        ]
        facts = documentary_intervention_relation_facts(statements)
        self.assertEqual(len(facts), 2)
        self.assertEqual(
            {fact["statement_text"] for fact in facts},
            {"SHP foi ampliado.", "SHP não foi alterado."},
        )
        self.assertEqual(explicit_intervention_relations(statements), {})

    def test_component_alias_does_not_resolve_a_whole_smsci_relation(self):
        component_statements = [
            {
                "smsci_reference_text": "CENTRAL_GLP",
                "relation": "PREEXISTING_SYSTEM_DECLARED_UNCHANGED",
                "individually_identified": True,
                "source_document": "memorial-sintetico",
                "source_location": "p. 1, par. 1",
            },
            {
                "smsci_reference_text": "HIDRANTE",
                "relation": "PREEXISTING_SYSTEM_DECLARED_UNCHANGED",
                "individually_identified": True,
                "source_document": "memorial-sintetico",
                "source_location": "p. 1, par. 2",
            },
        ]
        descriptive_fact = {
            "alteration_description": (
                "Menção à central GLP e a hidrante, sem identificar os SMSCI completos."
            ),
            "source_location": "p. 1, par. 1-2",
        }
        self.assertEqual(documentary_intervention_relation_facts(component_statements), [])
        self.assertEqual(explicit_intervention_relations(component_statements), {})
        self.assertIn("central GLP", descriptive_fact["alteration_description"])
        self.assertIn("hidrante", descriptive_fact["alteration_description"])
        self.assertTrue(descriptive_fact["source_location"])

    def test_complete_canonical_smsci_name_can_resolve_relation(self):
        statement = {
            "smsci_reference_text": "Instalação de Gás",
            "relation": "PREEXISTING_SYSTEM_DECLARED_UNCHANGED",
            "individually_identified": True,
            "source_document": "memorial-sintetico",
            "source_location": "p. 1, par. 3",
        }
        self.assertEqual(
            explicit_intervention_relations([statement]),
            {"SMSCI_GAS": "PREEXISTING_SYSTEM_DECLARED_UNCHANGED"},
        )

    def test_08_igc_omitted_from_explanation_is_not_marked_unchanged(self):
        relations = explicit_intervention_relations([self.shp_unchanged])
        self.assertNotIn("SMSCI_GAS", relations)
        self.assertIn(
            "SMSCI_GAS",
            t1_drt_worklist(self.global_scope, self.article_98, relations),
        )

    def test_09_generic_remaining_systems_declaration_does_not_expand_per_system(self):
        generic = {
            "statement_text": "Os demais sistemas permanecem inalterados.",
            "individually_identified": False,
            "source_document": "memorial-sintetico",
            "source_location": "p. 1",
        }
        self.assertEqual(explicit_intervention_relations([generic]), {})
        self.assertEqual(
            t1_drt_worklist(self.global_scope, self.article_98, {}),
            self.global_scope,
        )

    def test_10_absence_is_only_a_workflow_event_and_never_an_esci_pending(self):
        gate = SupplementalGate()
        self.assertEqual(gate.evaluate(True, False, "NO"), "CONTINUE")
        workflow_only = gate.interaction_events
        self.assertFalse(any("FAIL" in event or "NC" in event for event in workflow_only))
        self.assertFalse(any("PEND" in event or "e-SCI" in event for event in workflow_only))
        self.assertFalse(hasattr(gate, "normative_results"))

    def test_11_affected_system_keeps_both_drt_and_requirement_scope(self):
        relation = {
            "official_esci_code": "IGC",
            "relation": "PREEXISTING_SYSTEM_AFFECTED",
            "individually_identified": True,
            "source_document": "memorial-sintetico",
            "source_location": "p. 2",
        }
        relations = explicit_intervention_relations([relation])
        self.assertIn(
            "SMSCI_GAS",
            t1_drt_worklist(self.global_scope, self.article_98, relations),
        )
        self.assertIn("REQ_IN08_ESTANQUEIDADE", table4_requirements(self.global_scope))
        self.assertIn("REQ_IN08_MANUAL", table4_requirements(self.global_scope))

    def test_12_explanatory_statements_alone_do_not_activate_art98_filter(self):
        # Even a complete bundle of user-supplied declarations is not itself
        # approved technical evidence that an existing system was unaffected.
        self.assertEqual(
            t1_drt_worklist(
                self.global_scope,
                self.article_98,
                {"SMSCI_SHP": "PREEXISTING_SYSTEM_DECLARED_UNCHANGED"},
            ),
            self.global_scope,
        )

    def test_mutation_silence_to_unchanged_is_detected(self):
        no_system_statement = []
        relations = explicit_intervention_relations(no_system_statement)
        self.assertEqual(relations, {})
        self.assertNotEqual(
            relations.get("SMSCI_GAS"),
            "PREEXISTING_SYSTEM_DECLARED_UNCHANGED",
        )

    def test_mutation_global_smsci_to_automatically_affected_is_detected(self):
        relations = explicit_intervention_relations([])
        self.assertEqual(relations, {})
        self.assertTrue(self.global_scope)
        self.assertNotEqual(set(relations), self.global_scope)

    def test_mutation_user_absence_to_documentary_fact_is_detected(self):
        gate = SupplementalGate()
        gate.evaluate(True, False, "NO")
        self.assertNotIn("OPTIONAL_DOCUMENT_DECLINED", {
            fact for fact in getattr(gate, "rde_facts", [])
        })
        self.assertFalse(hasattr(gate, "rde_facts"))

    def test_mutation_absent_system_to_unaffected_filter_is_detected(self):
        relations = explicit_intervention_relations([self.shp_unchanged])
        worklist = t1_drt_worklist(self.global_scope, self.article_98, relations)
        self.assertIn("SMSCI_SHP", worklist)
        self.assertIn("SMSCI_GAS", worklist)
        self.assertIn("REQ_IN07_COMMISSIONING", table4_requirements(self.global_scope))

    def test_mutation_normal_process_asking_is_detected(self):
        gate = SupplementalGate()
        gate.evaluate(False, False)
        self.assertEqual(gate.interaction_events, [])

    def test_mutation_repeat_after_no_answer_is_detected(self):
        gate = SupplementalGate()
        self.assertEqual(gate.evaluate(True, False, "NO"), "CONTINUE")
        self.assertEqual(gate.evaluate(True, False), "CONTINUE")
        self.assertEqual(gate.interaction_events, ["OPTIONAL_DOCUMENT_DECLINED"])

    def test_optional_document_is_not_a_requirement_or_nonconformity(self):
        self.assertNotIn("PPCI_ALTERATION_EXPLANATION", REQUIREMENTS)
        self.assertNotIn("PPCI_ALTERATION_EXPLANATION", NONCONFORMITIES)
        self.assertNotIn("ofício", REPORTS.lower())
        self.assertNotIn("memorial de alteração", REPORTS.lower())

    def test_existing_document_answer_waits_for_attachment_then_continues(self):
        gate = SupplementalGate()
        self.assertEqual(gate.evaluate(True, False), "WAIT_FOR_RESPONSE")
        self.assertEqual(gate.evaluate(True, False, "YES"), "WAIT_FOR_ATTACHMENT")
        self.assertEqual(gate.evaluate(True, False), "WAIT_FOR_ATTACHMENT")
        self.assertEqual(
            gate.interaction_events,
            ["ASK_OPTIONAL_DOCUMENT", "WAIT_FOR_OPTIONAL_ATTACHMENT"],
        )
        self.assertEqual(gate.evaluate(True, True), "CONTINUE")
        self.assertEqual(gate.interaction_events.count("ASK_OPTIONAL_DOCUMENT"), 1)
        self.assertFalse(gate.awaiting_response)
        self.assertFalse(gate.waiting_for_attachment)

    def test_mutation_t4_global_filtering_is_detected(self):
        relations = explicit_intervention_relations([self.shp_unchanged])
        self.assertIn("SMSCI_SHP", relations)
        self.assertIn("REQ_IN07_COMMISSIONING", table4_requirements(self.global_scope))
        self.assertIn("REQ_IN08_ESTANQUEIDADE", table4_requirements(self.global_scope))

    def test_actual_gem_text_guards_gate_markers_absence_and_repeat_behavior(self):
        # This validates the checked-in Gem contract text, not LLM runtime behavior.
        self.assertEqual(gem_workflow_contract_violations(GEM), [])
        mutations = [
            GEM.replace(
                "Não pergunte em processo sem marcador documental direto.",
                "Pergunte em todos os processos.",
                1,
            ),
            GEM.replace(
                "Não pergunte novamente nesta mesma execução.",
                "Pergunte novamente nesta mesma execução.",
                1,
            ),
            GEM.replace(
                "A ausência do documento explicativo não é requisito",
                "A ausência do documento explicativo é um requisito",
                1,
            ),
            GEM.replace(
                "Não registre a resposta do usuário na",
                "Registre a resposta do usuário na",
                1,
            ),
            GEM.replace(
                "Habite-se de ampliação ou alteração de PPCI",
                "processo normal sem marcador documental",
                1,
            ),
        ]
        for mutated_text in mutations:
            with self.subTest(mutated_text=mutated_text[-180:]):
                self.assertTrue(gem_workflow_contract_violations(mutated_text))

    def test_model_contract_matches_declared_workflow_and_schema(self):
        self.assertEqual(gem_workflow_contract_violations(GEM), [])
        gate = GEM.split("SUPPLEMENTAL DOCUMENT WORKFLOW", 1)[1].split(
            "\nOUTPUT\n", 1
        )[0]
        self.assertIn("Antes de iniciar a EXTRACTION", gate)
        self.assertIn("não pergunte novamente nesta mesma execução", gate.lower())
        question = (
            "Foi apresentado ofício, memorial ou documento do responsável técnico\n"
            "explicando a alteração do PPCI?\n\n"
            "Se existir, anexe o documento para complementar a análise.\n"
            "Se não existir, informe que o documento não existe e a análise continuará\n"
            "com as informações disponíveis."
        )
        self.assertIn(question, gate)
        explanation = entity_block("PPCI_ALTERATION_EXPLANATION")
        relation = entity_block("PPCI_ALTERATION_SMSCI_STATEMENT")
        certificate = entity_block("ATESTADO_DE_CONSTRUCAO")
        for attribute in (
            "ALTERATION_TYPE", "ALTERATION_DESCRIPTION", "AFFECTED_AREAS",
            "PREVIOUS_AREA_M2", "ADDED_AREA_M2", "RESULTING_AREA_M2",
            "EXPANSION_EFFECT_ON_SMSCI",
        ):
            self.assertRegex(explanation, rf"(?m)^ATTRIBUTE {attribute} ")
        for value in RELATIONS:
            self.assertIn(value, relation)
        relation_text = normalized_text(relation)
        self.assertIn("sistema completo", relation_text)
        self.assertIn("CENTRAL_GLP não identifica toda a SMSCI_GAS", relation_text)
        self.assertIn("HIDRANTE, HIDRANTES ou REDE_DE_HIDRANTES", relation_text)
        self.assertIn("não crie um registro PPCI_ALTERATION_SMSCI_STATEMENT", relation_text)
        self.assertIn("ALTERATION_DESCRIPTION e SOURCE_LOCATION", relation_text)
        applicability_text = normalized_text(APPLICABILITY)
        self.assertIn("Conflicts, ambiguous references", APPLICABILITY)
        self.assertIn("CENTRAL_GLP alone does not identify all of SMSCI_GAS", applicability_text)
        self.assertIn("ATTRIBUTE ISSUE_DATE DATE", certificate)
        self.assertIn("Área previamente aprovada", certificate)
        worklist = t1_worklist_contract()
        self.assertIn("every and only official", worklist)
        self.assertIn("Declared intervention relations do not\nchange this worklist", worklist)
        self.assertIn("does not use them", APPLICABILITY)
        self.assertIn("alone to remove", APPLICABILITY)
        self.assertIn("Table 4 retains this global rule", PIPELINE)
        pipeline_text = normalized_text(PIPELINE)
        self.assertIn("complete, individually identified SMSCI", pipeline_text)
        self.assertIn("component mentions that do not identify a complete SMSCI", pipeline_text)
        self.assertIn("For an unresolved component mention, preserve its wording and source location only in ALTERATION_DESCRIPTION and SOURCE_LOCATION", pipeline_text)
        self.assertIn("No further documentary extraction is allowed", PIPELINE)
        self.assertIn("A RDE representa exclusivamente fatos documentais.", RDE)


if __name__ == "__main__":
    unittest.main()
