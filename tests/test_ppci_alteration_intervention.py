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
        "\nWORKLIST.SMSCI AND WORKLIST.SMSCI_EXECUTION\n", 1
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
        if statement.get("source_document")
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


def t1_drt_worklist(process_smsci, alteration_facts=None, relations=None):
    """Keep the global official target view intact across Phase 4B."""
    return process_smsci


DECISION_STATES = {
    "APPLICABLE", "NOT_APPLICABLE", "APPLICABILITY_REVIEW_REQUIRED",
}
POSITIVE_INTERVENTION_RELATIONS = {
    "EXECUTED_IN_INTERVENTION", "MODIFIED_OR_RESIZED",
    "PREEXISTING_SYSTEM_AFFECTED",
}
T4_PENDENTE = {
    "REQ_IN07_COMMISSIONING", "REQ_IN08_MANUAL", "REQ_IN09_DRT",
    "REQ_IN09_MANUAL", "REQ_IN09_CHECKLIST", "REQ_IN10_COMMISSIONING",
    "REQ_IN12_COMMISSIONING", "REQ_IN19_EXECUTION", "REQ_IN19_GROUNDING",
    "REQ_IN19_FINAL_VERIFICATION",
}
T4_PRESERVAR = {
    "REQ_T1_CONFORMITY_REPORT", "REQ_T1_CONFORMITY_REPORT_SIGNED",
    "REQ_IN08_ESTANQUEIDADE", "REQ_IN09_TEST_REPORT",
    "REQ_IN15_COMMISSIONING", "REQ_IN18_CMAR",
    "REQ_IN19_LEGACY_DOCUMENTATION",
}


def _has_source_reference(record):
    return bool(record and record.get("source_document") and record.get("source_location"))


def _record_matches_binding(record, binding_smsci):
    code = record.get("official_esci_code")
    return code == binding_smsci or official_map().get(code) == binding_smsci


def cumulative_exclusion_proven(binding_smsci, bundle):
    """Apply the contract's cumulative, identity-matched negative proof gate."""
    ppci = bundle.get("approved_ppci", {})
    if not (
        ppci.get("submission_class") == "COMPLEMENTARY"
        and ppci.get("approval_status") == "APPROVED"
        and ppci.get("identifier")
        and ppci.get("previous_attestado_protocol")
        and _has_source_reference(ppci)
    ):
        return False
    matches = [
        att for att in bundle.get("previous_attestations", [])
        if att.get("protocol_identifier") == ppci["previous_attestado_protocol"]
        and _has_source_reference(att)
    ]
    if len(matches) != 1:
        return False
    statements = bundle.get("statements", [])
    scope = [
        row for row in statements
        if _record_matches_binding(row, binding_smsci)
        and row.get("relation") == "PREEXISTING_SYSTEM_DECLARED_UNCHANGED"
        and row.get("outside_intervention_design_installation_declared") is True
        and row.get("ppci_identifier") == ppci["identifier"]
        and row.get("source_document") == ppci["source_document"]
        and row.get("area_identifier")
        and _has_source_reference(row)
    ]
    if len(scope) != 1:
        return False
    area = scope[0]["area_identifier"]
    reports = [
        row for row in bundle.get("signed_technical_reports", [])
        if row.get("signed") is True
        and row.get("ppci_identifier") == ppci["identifier"]
        and row.get("previous_attestado_protocol") == ppci["previous_attestado_protocol"]
        and _has_source_reference(row)
    ]
    if len(reports) != 1:
        return False
    report_statements = [
        row for row in statements
        if row.get("source_document") == reports[0]["source_document"]
        and _record_matches_binding(row, binding_smsci)
        and row.get("relation") == "PREEXISTING_SYSTEM_DECLARED_UNCHANGED"
        and row.get("ppci_identifier") == ppci["identifier"]
        and row.get("area_identifier") == area
        and _has_source_reference(row)
    ]
    if len(report_statements) != 1:
        return False
    conflicting = [
        row for row in bundle.get("conflicting_technical_records", [])
        if row.get("signed") is True
        and _record_matches_binding(row, binding_smsci)
        and row.get("area_identifier") == area
        and row.get("relation") in POSITIVE_INTERVENTION_RELATIONS
        and _has_source_reference(row)
    ]
    return not conflicting


def _decision(requirement, state, rationale, binding=None, facts=(), rde=(),
              sources=(), locations=()):
    source_status = (
        "COMPLETE" if sources and locations else
        "PARTIAL" if sources or locations else
        "NO_INDIVIDUALIZED_SOURCE_REFERENCE"
    )
    return {
        "requirement": requirement,
        "binding_smsci": binding,
        "rule_id": "REQ_T1_DRT_SMSCI_ART98_SCOPE" if binding else "DECLARED_REQUIREMENT_RULE",
        "decision": state,
        "pm_fact_references": tuple(facts),
        "rde_record_references": tuple(rde),
        "source_document_references": tuple(sources),
        "source_document_locations": tuple(locations),
        "source_reference_status": source_status,
        "base_rationale": rationale,
    }


def _proof_bundle_records(bundle):
    records = []
    for key in ("approved_ppci",):
        record = bundle.get(key)
        if isinstance(record, dict) and record:
            records.append(record)
    for key in (
        "previous_attestations", "statements", "signed_technical_reports",
        "conflicting_technical_records",
    ):
        records.extend(row for row in bundle.get(key, []) if isinstance(row, dict))
    return records


def resolve_t1_smsci_incidences(process_smsci, formal_alteration, statements=(),
                                proof_bundles=None):
    """Model Phase 4B's one closed decision per Requirement/SMSCI incidence."""
    proof_bundles = proof_bundles or {}
    relations = explicit_intervention_relations(statements)
    statement_by_target = {}
    for row in documentary_intervention_relation_facts(statements):
        target = complete_smsci_target(row)
        if target is not None:
            statement_by_target.setdefault(target, []).append(row)
    decisions = []
    if not process_smsci:
        decisions.append(_decision(
            "REQ_T1_DRT_SMSCI",
            "APPLICABLE",
            "Preserva a seleção geral declarada de RT-003 com domínio iterativo vazio.",
        ))
        validate_decision_ledger(
            [("REQ_T1_DRT_SMSCI", None)], decisions, proof_bundles
        )
        return decisions
    for binding in process_smsci:
        rows = statement_by_target.get(binding, [])
        bundle = proof_bundles.get(binding, {})
        relation = relations.get(binding) if formal_alteration else None
        proof_records = (
            _proof_bundle_records(bundle)
            if relation == "PREEXISTING_SYSTEM_DECLARED_UNCHANGED" else []
        )
        evidence_records = rows + proof_records
        source_refs = tuple(sorted({r["source_document"] for r in evidence_records if r.get("source_document")}))
        locations = tuple(sorted({r["source_location"] for r in evidence_records if r.get("source_location")}))
        rde_refs = tuple(sorted({
            r.get("rde_record_reference") or r.get("source_location")
            for r in evidence_records
            if r.get("rde_record_reference") or r.get("source_location")
        }))
        facts = tuple(sorted({
            r.get("pm_fact_reference") or r.get("source_location")
            for r in evidence_records
            if r.get("pm_fact_reference") or r.get("source_location")
        }))
        if not formal_alteration:
            state, rationale = "APPLICABLE", "Preserva seleção global sem alteração formal."
        elif relation in POSITIVE_INTERVENTION_RELATIONS:
            state, rationale = "APPLICABLE", "Incidência positiva documentada no SMSCI."
        elif relation == "PREEXISTING_SYSTEM_DECLARED_UNCHANGED" and cumulative_exclusion_proven(
            binding, bundle
        ):
            state, rationale = "NOT_APPLICABLE", "Escopo cumulativo comprova exclusão desta iteração."
        else:
            state, rationale = (
                "APPLICABILITY_REVIEW_REQUIRED",
                "Escopo documental insuficiente ou indeterminado para esta incidência.",
            )
        decisions.append(_decision(
            "REQ_T1_DRT_SMSCI", state, rationale, binding, facts, rde_refs,
            source_refs, locations,
        ))
    validate_decision_ledger(
        [("REQ_T1_DRT_SMSCI", binding) for binding in process_smsci],
        decisions, proof_bundles,
    )
    return decisions


def validate_decision_ledger(candidate_keys, decisions, proof_bundles=None):
    proof_bundles = proof_bundles or {}
    keys = [(d["requirement"], d.get("binding_smsci")) for d in decisions]
    if len(keys) != len(set(keys)) or set(keys) != set(candidate_keys):
        raise ValueError("applicability decision ledger is not closed and unique")
    if any(d.get("decision") not in DECISION_STATES for d in decisions):
        raise ValueError("invalid decision state")
    for decision in decisions:
        if (
            decision["requirement"] == "REQ_T1_DRT_SMSCI"
            and decision["decision"] == "NOT_APPLICABLE"
            and not cumulative_exclusion_proven(
                decision.get("binding_smsci"),
                proof_bundles.get(decision.get("binding_smsci"), {}),
            )
        ):
            raise ValueError("NOT_APPLICABLE lacks cumulative RT-003 proof")
        if decision["decision"] == "APPLICABILITY_REVIEW_REQUIRED":
            if decision.get("source_reference_status") not in {
                "COMPLETE", "PARTIAL", "NO_INDIVIDUALIZED_SOURCE_REFERENCE",
            }:
                raise ValueError("review source-reference status is not explicit")
    return True


def validate_review_routing(decisions, planned=(), engine=(), criterion=(),
                            results=(), nonconformities=(), esci=()):
    """Reject mutation of review incidences into execution or output streams."""
    review_bindings = {
        (d["requirement"], d.get("binding_smsci"))
        for d in decisions
        if d["decision"] == "APPLICABILITY_REVIEW_REQUIRED"
    }
    for label, rows in (
        ("plan", planned), ("Engine", engine), ("Criterion", criterion),
        ("result", results), ("Nonconformity", nonconformities),
        ("e-SCI", esci),
    ):
        if review_bindings.intersection(rows):
            raise ValueError(f"applicability review leaked into {label}")
    return True


def phase4c_t1_unit(decisions):
    t1_decisions = [
        d for d in decisions if d["requirement"] == "REQ_T1_DRT_SMSCI"
    ]
    applicable = tuple(
        d["binding_smsci"] for d in t1_decisions
        if d["decision"] == "APPLICABLE" and d.get("binding_smsci") is not None
    )
    selected_empty_domain = any(
        d["decision"] == "APPLICABLE" and d.get("binding_smsci") is None
        for d in t1_decisions
    )
    if not applicable and not selected_empty_domain:
        return ()
    return ({
        "unit_key": "(REQ_T1_DRT_SMSCI, T1_DRT_SMSCI_COVERAGE)",
        "planned_bindings": applicable,
    },)


def report_status(results, applicability_reviews=()):
    if any(result == "FAIL" for result in results):
        return "COM PENDÊNCIAS"
    if any(result == "MANUAL_REVIEW" for result in results) or applicability_reviews:
        return "NECESSITA ANÁLISE HUMANA"
    return "SEM PENDÊNCIAS DOCUMENTAIS"


def decide_t4_incidence(requirement, target, process_smsci, formal_alteration,
                        relation=None, proof_bundle=None):
    if target not in process_smsci:
        return "NOT_APPLICABLE"
    if not formal_alteration or requirement in T4_PRESERVAR:
        return "APPLICABLE"
    if requirement not in T4_PENDENTE:
        return "APPLICABLE"
    if relation in POSITIVE_INTERVENTION_RELATIONS:
        return "APPLICABLE"
    # The cumulative art. 98 proof is specific to RT-003, not Table 4.
    return "APPLICABILITY_REVIEW_REQUIRED"


def in19_regime_from_request_date(request_date):
    if not request_date:
        return "UNRESOLVED"
    return "LEGACY" if request_date <= "2024-04-24" else "CURRENT"


def in19_requirements_for_regime(regime):
    return {
        "CURRENT": {"REQ_IN19_EXECUTION", "REQ_IN19_GROUNDING", "REQ_IN19_FINAL_VERIFICATION"},
        "LEGACY": {"REQ_IN19_LEGACY_DOCUMENTATION"},
        "UNRESOLVED": {"REQ_IN19_REGIME_REVIEW"},
    }[regime]


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
            "source_document": "memorial-sintetico",
            "source_location": "p. 1, par. 2",
        }
        self.shp_unchanged = {
            "official_esci_code": "SHP",
            "relation": "PREEXISTING_SYSTEM_DECLARED_UNCHANGED",
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
                "source_document": "memorial-sintetico",
                "source_location": "p. 1, par. 1",
            },
            {
                "smsci_reference_text": "HIDRANTE",
                "relation": "PREEXISTING_SYSTEM_DECLARED_UNCHANGED",
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
        self.assertIn("OUTSIDE_INTERVENTION_DESIGN_INSTALLATION_DECLARED", relation_text)
        self.assertIn("Ausência, silêncio ou omissão do SMSCI não", relation_text)
        self.assertIn("não crie um registro PPCI_ALTERATION_SMSCI_STATEMENT", relation_text)
        self.assertIn("ALTERATION_DESCRIPTION e SOURCE_LOCATION", relation_text)
        applicability_text = normalized_text(APPLICABILITY)
        self.assertIn("Conflicts, ambiguous references", APPLICABILITY)
        self.assertIn("CENTRAL_GLP alone does not identify all of SMSCI_GAS", applicability_text)
        self.assertIn("ATTRIBUTE ISSUE_DATE DATE", certificate)
        self.assertIn("Área previamente aprovada", certificate)
        worklist = t1_worklist_contract()
        self.assertIn("every and only positive OFFICIAL_ESCI_SCOPE", worklist)
        self.assertIn("WORKLIST.SMSCI_EXECUTION is the ordered subset", worklist)
        self.assertIn("only iteration domain passed to T1_DRT_SMSCI_COVERAGE", worklist)
        self.assertIn("PROCESS.SMSCI remain unchanged", APPLICABILITY)
        self.assertIn("alone cannot prove NOT_APPLICABLE", APPLICABILITY)
        self.assertIn("filter Table 4 as a block", normalized_text(PIPELINE))
        pipeline_text = normalized_text(PIPELINE)
        self.assertIn("complete, individually identified SMSCI", pipeline_text)
        self.assertIn("component mentions that do not identify a complete SMSCI", pipeline_text)
        self.assertIn("For an unresolved component mention, preserve its wording and source location only in ALTERATION_DESCRIPTION and SOURCE_LOCATION", pipeline_text)
        self.assertIn("No further documentary extraction is allowed", PIPELINE)
        self.assertIn("A RDE representa exclusivamente fatos documentais.", RDE)


class RequirementIncidenceApplicabilityTests(unittest.TestCase):
    def setUp(self):
        self.global_scope = ("SMSCI_SHP", "SMSCI_GAS", "SMSCI_CMAR")
        self.signed_off_scope_proof = {
            "approved_ppci": {
                "identifier": "PPCI-C-42",
                "submission_class": "COMPLEMENTARY",
                "approval_status": "APPROVED",
                "previous_attestado_protocol": "ATEST-19",
                "source_document": "ppci-complementar-aprovado",
                "source_location": "folha de aprovação e identificação",
            },
            "previous_attestations": [{
                "protocol_identifier": "ATEST-19",
                "source_document": "atestado-anterior",
                "source_location": "capa, protocolo",
            }],
            "statements": [{
                "official_esci_code": "SHP",
                "relation": "PREEXISTING_SYSTEM_DECLARED_UNCHANGED",
                "ppci_identifier": "PPCI-C-42",
                "area_identifier": "AREA-BLOCO-A",
                "outside_intervention_design_installation_declared": True,
                "source_document": "ppci-complementar-aprovado",
                "source_location": "prancha SHP, quadro de escopo",
            }, {
                "official_esci_code": "SHP",
                "relation": "PREEXISTING_SYSTEM_DECLARED_UNCHANGED",
                "ppci_identifier": "PPCI-C-42",
                "area_identifier": "AREA-BLOCO-A",
                "source_document": "laudo-RT-003",
                "source_location": "item 4, conclusão por sistema",
            }],
            "signed_technical_reports": [{
                "signed": True,
                "ppci_identifier": "PPCI-C-42",
                "previous_attestado_protocol": "ATEST-19",
                "source_document": "laudo-RT-003",
                "source_location": "identificação e assinatura",
            }],
            "conflicting_technical_records": [],
        }
        self.shp_unchanged = {
            "official_esci_code": "SHP",
            "relation": "PREEXISTING_SYSTEM_DECLARED_UNCHANGED",
            "ppci_identifier": "PPCI-C-42",
            "area_identifier": "AREA-BLOCO-A",
            "source_document": "ppci-complementar-aprovado",
            "source_location": "prancha SHP, quadro de escopo",
        }

    def decisions(self, statements=(), proof_bundles=None, formal=True):
        return resolve_t1_smsci_incidences(
            self.global_scope, formal, statements, proof_bundles
        )

    def state_by_binding(self, decisions):
        return {row["binding_smsci"]: row["decision"] for row in decisions}

    def test_01_to_03_closed_tri_state_and_cumulative_exclusion(self):
        common = self.decisions([{
            "official_esci_code": "SHP", "relation": "MODIFIED_OR_RESIZED",
            "source_document": "oficio",
            "source_location": "p. 2",
        }])
        self.assertEqual(self.state_by_binding(common)["SMSCI_SHP"], "APPLICABLE")
        proven = self.decisions(
            [self.shp_unchanged], {"SMSCI_SHP": self.signed_off_scope_proof}
        )
        self.assertEqual(self.state_by_binding(proven)["SMSCI_SHP"], "NOT_APPLICABLE")
        proven_row = next(
            d for d in proven if d["binding_smsci"] == "SMSCI_SHP"
        )
        self.assertTrue({"ppci-complementar-aprovado", "atestado-anterior", "laudo-RT-003"}.issubset(
            set(proven_row["source_document_references"])
        ))
        self.assertTrue({
            "folha de aprovação e identificação", "capa, protocolo",
            "item 4, conclusão por sistema",
        }.issubset(set(proven_row["source_document_locations"])))
        self.assertEqual(proven_row["source_reference_status"], "COMPLETE")
        incomplete = self.decisions([self.shp_unchanged])
        self.assertEqual(
            self.state_by_binding(incomplete)["SMSCI_SHP"],
            "APPLICABILITY_REVIEW_REQUIRED",
        )
        keys = [("REQ_T1_DRT_SMSCI", binding) for binding in self.global_scope]
        self.assertTrue(validate_decision_ledger(keys, incomplete))
        for row in incomplete:
            self.assertIn(row["decision"], DECISION_STATES)
            self.assertTrue(row["rule_id"])
            self.assertIn("base_rationale", row)
            self.assertIn("pm_fact_references", row)
            self.assertIn("rde_record_references", row)
            self.assertIn("source_document_references", row)

    def test_04_to_09_review_has_no_engine_plan_criterion_result_nc_or_esci_projection(self):
        decisions = self.decisions()
        reviews = [d for d in decisions if d["decision"] == "APPLICABILITY_REVIEW_REQUIRED"]
        self.assertEqual(len(reviews), len(self.global_scope))
        self.assertEqual(phase4c_t1_unit(decisions), ())
        self.assertNotIn("APPLICABILITY_REVIEW_REQUIRED", NONCONFORMITIES)
        engine = (KB / "00_engine.txt").read_text(encoding="utf-8")
        self.assertNotIn("APPLICABILITY_REVIEW_REQUIRED", engine)
        self.assertIn("not a Criterion result", PIPELINE)
        self.assertIn("do not affect", PIPELINE)
        self.assertIn("Nonconformities or e-SCI projection", PIPELINE)
        self.assertIn("TRATAMENTO HUMANO", REPORTS)
        self.assertIn("incidências APPLICABILITY_REVIEW_REQUIRED", REPORTS)
        self.assertIn("HUMAN_TREATMENT_OBLIGATION", APPLICABILITY)
        self.assertIn("HUMAN_TREATMENT_REASON", APPLICABILITY)
        self.assertIn("HUMAN_TREATMENT_REASON", REPORTS)
        self.assertNotIn("REQ_T1_DRT_SMSCI", REPORTS.split("STATUS OPERACIONAL", 1)[0])

    def test_10_and_11_report_status_keeps_review_separate_from_fail(self):
        decisions = self.decisions()
        reviews = [d for d in decisions if d["decision"] == "APPLICABILITY_REVIEW_REQUIRED"]
        self.assertEqual(report_status([], reviews), "NECESSITA ANÁLISE HUMANA")
        self.assertEqual(report_status(["FAIL"], reviews), "COM PENDÊNCIAS")
        self.assertIn("liste a revisão separadamente", normalized_text(REPORTS))
        self.assertIn("sua presença afeta somente o status", normalized_text(REPORTS).casefold())

    def test_12_to_17_no_alteration_and_all_positive_relations_preserve_rt003(self):
        unchanged_process = self.decisions(formal=False)
        self.assertEqual(set(self.state_by_binding(unchanged_process).values()), {"APPLICABLE"})
        for relation in sorted(POSITIVE_INTERVENTION_RELATIONS):
            with self.subTest(relation=relation):
                statement = {
                    "official_esci_code": "SHP", "relation": relation,
                    "source_document": "oficio",
                    "source_location": "p. 2, item 1",
                }
                decisions = self.decisions([statement])
                self.assertEqual(self.state_by_binding(decisions)["SMSCI_SHP"], "APPLICABLE")
                unit = phase4c_t1_unit(decisions)[0]
                self.assertIn("SMSCI_SHP", unit["planned_bindings"])
        proven = self.decisions(
            [self.shp_unchanged], {"SMSCI_SHP": self.signed_off_scope_proof}
        )
        self.assertEqual(self.state_by_binding(proven)["SMSCI_SHP"], "NOT_APPLICABLE")
        planned_bindings = {
            binding for unit in phase4c_t1_unit(proven)
            for binding in unit["planned_bindings"]
        }
        self.assertNotIn("SMSCI_SHP", planned_bindings)
        unknown = self.decisions([{
            "smsci_reference_text": "central_glp",
            "relation": "MODIFIED_OR_RESIZED",
            "source_document": "oficio",
            "source_location": "p. 2",
        }])
        self.assertEqual(self.state_by_binding(unknown)["SMSCI_SHP"], "APPLICABILITY_REVIEW_REQUIRED")

    def test_18_to_20_missing_silent_and_generic_officio_never_prove_out_of_scope(self):
        absent = self.decisions()
        silent = self.decisions([])
        generic = self.decisions([{
            "statement_text": "Os demais sistemas permanecem inalterados.",
            "source_document": "oficio",
            "source_location": "p. 1",
        }])
        for rows in (absent, silent, generic):
            self.assertEqual(self.state_by_binding(rows)["SMSCI_SHP"], "APPLICABILITY_REVIEW_REQUIRED")
            self.assertNotEqual(self.state_by_binding(rows)["SMSCI_SHP"], "NOT_APPLICABLE")

    def test_21_phase4b_does_not_reduce_process_or_global_worklist(self):
        decisions = self.decisions(
            [self.shp_unchanged], {"SMSCI_SHP": self.signed_off_scope_proof}
        )
        self.assertEqual(t1_drt_worklist(self.global_scope, {}, decisions), self.global_scope)
        self.assertEqual(set(self.global_scope), {"SMSCI_SHP", "SMSCI_GAS", "SMSCI_CMAR"})
        self.assertEqual(phase4c_t1_unit(decisions), ())
        self.assertIn("PROCESS.SMSCI remain unchanged", normalized_text(APPLICABILITY))

        mixed_scope = ("SMSCI_SHP", "SMSCI_GAS")
        mixed = resolve_t1_smsci_incidences(
            mixed_scope,
            True,
            [{
                "official_esci_code": "SHP",
                "relation": "MODIFIED_OR_RESIZED",
                "source_document": "ppci-complementar",
                "source_location": "quadro de sistemas, SHP",
            }],
        )
        self.assertEqual(self.state_by_binding(mixed), {
            "SMSCI_SHP": "APPLICABLE",
            "SMSCI_GAS": "APPLICABILITY_REVIEW_REQUIRED",
        })
        self.assertEqual(
            phase4c_t1_unit(mixed)[0]["planned_bindings"], ("SMSCI_SHP",)
        )
        self.assertTrue(validate_review_routing(
            mixed,
            planned={("REQ_T1_DRT_SMSCI", "SMSCI_SHP")},
        ))
        self.assertIn("SMSCI_GAS", {
            d["binding_smsci"] for d in mixed
            if d["decision"] == "APPLICABILITY_REVIEW_REQUIRED"
        })

    def test_22_t4_keeps_preserved_requirements_and_reviews_only_pendente_incidence(self):
        for requirement in sorted(T4_PENDENTE):
            block = re.search(
                rf"(?m)^REQUIREMENT {requirement}\n(.*?)^END$", REQUIREMENTS, re.S
            ).group(1)
            target = re.search(r"(?m)^SMSCI (\S+)$", block).group(1)
            with self.subTest(requirement=requirement):
                # Full RT-003 art. 98 proof cannot suppress a separate T4 obligation.
                self.assertEqual(
                    decide_t4_incidence(
                        requirement, target, (target,), True,
                        "PREEXISTING_SYSTEM_DECLARED_UNCHANGED",
                        self.signed_off_scope_proof,
                    ),
                    "APPLICABILITY_REVIEW_REQUIRED",
                )
                self.assertEqual(
                    decide_t4_incidence(
                        requirement, target, (target,), True,
                        "PREEXISTING_SYSTEM_AFFECTED",
                    ),
                    "APPLICABLE",
                )
        preserved_t4 = {
            "REQ_IN08_ESTANQUEIDADE", "REQ_IN09_TEST_REPORT",
            "REQ_IN15_COMMISSIONING", "REQ_IN18_CMAR",
            "REQ_IN19_LEGACY_DOCUMENTATION",
        }
        for requirement in sorted(preserved_t4):
            block = re.search(
                rf"(?m)^REQUIREMENT {requirement}\n(.*?)^END$", REQUIREMENTS, re.S
            ).group(1)
            target = re.search(r"(?m)^SMSCI (\S+)$", block).group(1)
            self.assertEqual(
                decide_t4_incidence(
                    requirement, target, (target,), True,
                    "PREEXISTING_SYSTEM_DECLARED_UNCHANGED",
                    self.signed_off_scope_proof,
                ),
                "APPLICABLE",
            )
        self.assertNotIn("same complete cumulative proof gate", APPLICABILITY)
        self.assertIn("shall not be reused by analogy", APPLICABILITY)
        self.assertIn("filter Table 4 as a block", normalized_text(PIPELINE))

    def test_23_to_25_in19_temporal_regimes_remain_independent_of_intervention(self):
        expected = {
            "2025-01-03": ("CURRENT", {"REQ_IN19_EXECUTION", "REQ_IN19_GROUNDING", "REQ_IN19_FINAL_VERIFICATION"}),
            "2024-01-03": ("LEGACY", {"REQ_IN19_LEGACY_DOCUMENTATION"}),
            None: ("UNRESOLVED", {"REQ_IN19_REGIME_REVIEW"}),
        }
        for request_date, pair in expected.items():
            regime, selected = pair
            self.assertEqual(in19_regime_from_request_date(request_date), regime)
            self.assertEqual(in19_requirements_for_regime(regime), selected)
            t1 = self.decisions([self.shp_unchanged])
            self.assertEqual(self.state_by_binding(t1)["SMSCI_SHP"], "APPLICABILITY_REVIEW_REQUIRED")
        self.assertIn("do not reuse REQ_IN19_REGIME_REVIEW", APPLICABILITY)

    def test_26_integral_habite_se_contract_keeps_existing_normal_behavior(self):
        no_alteration = self.decisions(formal=False)
        self.assertTrue(all(d["decision"] == "APPLICABLE" for d in no_alteration))
        self.assertEqual(phase4c_t1_unit(no_alteration)[0]["planned_bindings"], self.global_scope)
        self.assertIn("preserve existing global selection", APPLICABILITY)

    def test_27_empty_worklist_preserves_prior_general_rt003_selection_and_plan(self):
        decisions = resolve_t1_smsci_incidences((), formal_alteration=False)
        self.assertEqual(len(decisions), 1)
        self.assertEqual(decisions[0]["requirement"], "REQ_T1_DRT_SMSCI")
        self.assertIsNone(decisions[0]["binding_smsci"])
        self.assertEqual(decisions[0]["decision"], "APPLICABLE")
        self.assertEqual(
            decisions[0]["source_reference_status"],
            "NO_INDIVIDUALIZED_SOURCE_REFERENCE",
        )

        plan = phase4c_t1_unit(decisions)
        self.assertEqual(len(plan), 1)
        self.assertEqual(
            plan[0]["unit_key"],
            "(REQ_T1_DRT_SMSCI, T1_DRT_SMSCI_COVERAGE)",
        )
        self.assertEqual(plan[0]["planned_bindings"], ())

        requirement = re.search(
            r"REQUIREMENT REQ_T1_DRT_SMSCI\n(.*?)\nEND", REQUIREMENTS, re.S
        ).group(1)
        criterion = re.search(
            r"CRITERION T1_DRT_SMSCI_COVERAGE\n(.*?)\nEND",
            (KB / "03_table1.txt").read_text(encoding="utf-8"),
            re.S,
        ).group(1)
        self.assertNotRegex(requirement, r"(?m)^SMSCI ")
        self.assertIn("FOR_EACH WORKLIST.SMSCI_EXECUTION", requirement)
        self.assertIn("USES REQ_T1_DRT_SMSCI", criterion)

    def test_mutations_review_cannot_become_fail_na_engine_nc_or_esci(self):
        actual = self.decisions()
        review = next(d for d in actual if d["binding_smsci"] == "SMSCI_SHP")
        self.assertEqual(review["decision"], "APPLICABILITY_REVIEW_REQUIRED")
        self.assertNotIn("FAIL", DECISION_STATES)
        mutant_fail = dict(review, decision="FAIL")
        with self.assertRaises(ValueError):
            validate_decision_ledger(
                [("REQ_T1_DRT_SMSCI", b) for b in self.global_scope],
                [mutant_fail if d is review else d for d in actual],
            )
        mutant_na = [
            dict(row, decision="NOT_APPLICABLE") if row is review else row
            for row in actual
        ]
        with self.assertRaisesRegex(ValueError, "lacks cumulative RT-003 proof"):
            validate_decision_ledger(
                [("REQ_T1_DRT_SMSCI", b) for b in self.global_scope], mutant_na
            )
        self.assertEqual(
            decide_t4_incidence(
                "REQ_IN07_COMMISSIONING", "SMSCI_SHP", ("SMSCI_SHP",), True,
                "PREEXISTING_SYSTEM_DECLARED_UNCHANGED",
                self.signed_off_scope_proof,
            ),
            "APPLICABILITY_REVIEW_REQUIRED",
        )
        self.assertEqual(phase4c_t1_unit(actual), ())
        self.assertTrue(validate_review_routing(actual))
        review_key = ("REQ_T1_DRT_SMSCI", review["binding_smsci"])
        for route in ("planned", "engine", "criterion", "results", "nonconformities", "esci"):
            with self.subTest(route=route):
                with self.assertRaisesRegex(ValueError, "leaked into"):
                    validate_review_routing(actual, **{route: {review_key}})
        self.assertIn("not a Criterion result, MANUAL_REVIEW, UNKNOWN, FAIL, Nonconformity or planned binding", normalized_text(PIPELINE))
        self.assertIn("não é MANUAL_REVIEW", normalized_text(REPORTS))

    def test_mutations_absent_or_isolated_officio_cannot_prove_no_intervention(self):
        self.assertEqual(self.state_by_binding(self.decisions())["SMSCI_SHP"], "APPLICABILITY_REVIEW_REQUIRED")
        self.assertEqual(self.state_by_binding(self.decisions([self.shp_unchanged]))["SMSCI_SHP"], "APPLICABILITY_REVIEW_REQUIRED")
        broken = {"SMSCI_SHP": dict(self.signed_off_scope_proof)}
        broken["SMSCI_SHP"]["signed_technical_reports"] = []
        self.assertFalse(cumulative_exclusion_proven("SMSCI_SHP", broken["SMSCI_SHP"]))

    def test_mutations_affecting_global_scope_t4_or_in19_are_detected(self):
        changed = {
            "official_esci_code": "SHP", "relation": "PREEXISTING_SYSTEM_AFFECTED",
            "source_document": "laudo",
            "source_location": "p. 2",
        }
        decisions = self.decisions([changed])
        self.assertEqual(self.state_by_binding(decisions)["SMSCI_SHP"], "APPLICABLE")
        self.assertIn("SMSCI_SHP", phase4c_t1_unit(decisions)[0]["planned_bindings"])
        self.assertEqual(t1_drt_worklist(self.global_scope, {}, decisions), self.global_scope)
        self.assertEqual(
            decide_t4_incidence("REQ_IN08_ESTANQUEIDADE", "SMSCI_GAS",
                                self.global_scope, True, "PREEXISTING_SYSTEM_DECLARED_UNCHANGED"),
            "APPLICABLE",
        )
        self.assertEqual(in19_requirements_for_regime("UNRESOLVED"), {"REQ_IN19_REGIME_REVIEW"})
        self.assertIn("REQUEST_DATE", APPLICABILITY)

    def test_decision_ledger_rejects_missing_duplicate_or_unrecognized_incidences(self):
        decisions = self.decisions()
        candidate_keys = [("REQ_T1_DRT_SMSCI", binding) for binding in self.global_scope]
        with self.assertRaises(ValueError):
            validate_decision_ledger(candidate_keys, decisions[:-1])
        with self.assertRaises(ValueError):
            validate_decision_ledger(candidate_keys, decisions + [decisions[0]])
        invalid = [dict(row) for row in decisions]
        invalid[0]["decision"] = "UNKNOWN"
        with self.assertRaises(ValueError):
            validate_decision_ledger(candidate_keys, invalid)


if __name__ == "__main__":
    unittest.main()
