#!/usr/bin/env python3
"""Build the ten-document deployable Knowledge Base release."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KNOWLEDGE_BASE = ROOT / "knowledge-base"
PIPELINE = KNOWLEDGE_BASE / "08_execution_pipeline.txt"
ENTITIES = KNOWLEDGE_BASE / "01_entities.txt"
PLACEHOLDER = "RELEASE_BUILD_REQUIRED"
REQUIREMENTS = KNOWLEDGE_BASE / "02_requirements.txt"
APPLICABILITY = KNOWLEDGE_BASE / "02a_applicability.txt"
CRITERIA_SOURCES = (
    KNOWLEDGE_BASE / "03_table1.txt",
    KNOWLEDGE_BASE / "04_table4.txt",
)
NONCONFORMITIES = KNOWLEDGE_BASE / "05_nonconformities.txt"
RUNTIME_CONTRACT = ROOT / "apps-script" / "CompiledRuntimeContract.js"
COMPILED_INDEX_HEADER = "COMPILED_EXECUTION_INDEX"
DERIVED_ARTIFACT_SENTINELS = (
    "GENERATED_DERIVED_ARTIFACT",
    "DO_NOT_EDIT_AS_NORMATIVE_SOURCE",
)


def git(*args: str) -> str:
    return subprocess.run(
        ("git", *args), cwd=ROOT, check=True, text=True, capture_output=True
    ).stdout.strip()


def parse_manifest(text: str) -> dict[str, str]:
    block = re.search(r"^DOCUMENT_SET:\s*$\n(.*?)^END DOCUMENT_SET\.$", text, re.M | re.S)
    if not block:
        raise ValueError("DOCUMENT_SET ausente ou malformado")
    entries = re.findall(
        r"^([^:\n]+\.txt): DOCUMENT_VERSION (\d+\.\d+\.\d+)\s*$",
        block.group(1),
        re.M,
    )
    manifest = dict(entries)
    if len(manifest) != len(entries):
        raise ValueError("documento duplicado em DOCUMENT_SET")
    return manifest


def inject_document_version(text: str, version: str) -> str:
    declared = re.findall(
        r"^#?\s*DOCUMENT_VERSION:\s*(\S+)\s*$", text, re.M
    )
    if declared:
        if declared != [version]:
            raise ValueError(
                f"DOCUMENT_VERSION carregado {declared!r} difere do manifesto {version}"
            )
        return text
    return f"DOCUMENT_VERSION: {version}\n\n{text}"


def _blocks(text: str, declaration: str) -> list[tuple[str, str]]:
    """Return declared blocks in source order, without interpreting their content."""
    matches = list(re.finditer(rf"^{declaration}\s+(\S+)\s*$", text, re.M))
    seen: set[str] = set()
    blocks = []
    for position, match in enumerate(matches):
        identifier = match.group(1)
        if identifier in seen:
            raise ValueError(f"{declaration} duplicado: {identifier}")
        seen.add(identifier)
        end = matches[position + 1].start() if position + 1 < len(matches) else len(text)
        blocks.append((identifier, text[match.start() : end]))
    if not blocks:
        raise ValueError(f"nenhum bloco {declaration} encontrado")
    return blocks


def _for_each_source(block: str, identifier: str) -> str | None:
    sources = re.findall(r"^FOR_EACH\s+(\S+)\s*$", block, re.M)
    if len(sources) > 1:
        raise ValueError(f"FOR_EACH ambíguo em {identifier}")
    return sources[0] if sources else None


def parse_requirements(text: str) -> list[tuple[str, str | None]]:
    """Parse canonical Requirement order and their declared iteration source."""
    return [
        (identifier, _for_each_source(block, identifier))
        for identifier, block in _blocks(text, "REQUIREMENT")
    ]


def parse_criteria(text: str) -> list[tuple[str, str, str | None]]:
    """Parse Criterion order and its sole declared Requirement association."""
    parsed = []
    for identifier, block in _blocks(text, "CRITERION"):
        links = re.findall(r"^(?:USES|REQUIREMENT)\s+(\S+)\s*$", block, re.M)
        if len(links) != 1:
            raise ValueError(
                f"CRITERION {identifier} deve declarar exatamente um vínculo de Requirement"
            )
        parsed.append((identifier, links[0], _for_each_source(block, identifier)))
    return parsed


def compile_execution_index(requirements_text: str, *criteria_texts: str) -> str:
    """Compile only declared Requirement→Criterion identity links for a release."""
    requirements = parse_requirements(requirements_text)
    requirement_sources = dict(requirements)
    criteria_by_requirement = {identifier: [] for identifier, _ in requirements}
    seen_criteria: set[str] = set()
    for text in criteria_texts:
        for criterion_id, requirement_id, criterion_source in parse_criteria(text):
            if criterion_id in seen_criteria:
                raise ValueError(f"CRITERION duplicado: {criterion_id}")
            seen_criteria.add(criterion_id)
            if requirement_id not in criteria_by_requirement:
                raise ValueError(
                    f"CRITERION {criterion_id} referencia Requirement inexistente: {requirement_id}"
                )
            if criterion_source != requirement_sources[requirement_id]:
                raise ValueError(
                    f"FOR_EACH incompatível entre {requirement_id} e {criterion_id}"
                )
            criteria_by_requirement[requirement_id].append(criterion_id)
    uncovered = [identifier for identifier, criteria in criteria_by_requirement.items() if not criteria]
    if uncovered:
        raise ValueError("Requirement sem Criterion declarado: " + ", ".join(uncovered))
    lines = [COMPILED_INDEX_HEADER, *DERIVED_ARTIFACT_SENTINELS, ""]
    for requirement_id, iteration_source in requirements:
        lines.append(f"REQUIREMENT {requirement_id}")
        lines.extend(
            f"  UNIT_KEY ({requirement_id}, {criterion_id})"
            for criterion_id in criteria_by_requirement[requirement_id]
        )
        if iteration_source:
            lines.append(f"  ITERATION_SOURCE {iteration_source}")
        lines.extend(("END", ""))
    lines.append(f"END {COMPILED_INDEX_HEADER}")
    return "\n".join(lines) + "\n"


def _single_field(block: str, field: str, identifier: str, required: bool = False) -> str | None:
    values = re.findall(rf"^{re.escape(field)}\s+(.+?)\s*$", block, re.M)
    if len(values) > 1 or (required and len(values) != 1):
        raise ValueError(f"{field} ausente ou ambíguo em {identifier}")
    return values[0] if values else None


def _field_list(block: str, field: str) -> list[str]:
    return re.findall(rf"^{re.escape(field)}\s+(.+?)\s*$", block, re.M)


def _parse_assert_argument(token: str, identifier: str) -> dict[str, object]:
    token = token.strip()
    if not token:
        raise ValueError(f"argumento ASSERT vazio em {identifier}")
    if token.startswith('"') and token.endswith('"'):
        try:
            return {"type": "LITERAL", "value": json.loads(token)}
        except json.JSONDecodeError as error:
            raise ValueError(f"literal ASSERT inválido em {identifier}") from error
    if re.fullmatch(r"-?\d+", token):
        return {"type": "LITERAL", "value": int(token)}
    if re.fullmatch(r"-?\d+\.\d+", token):
        return {"type": "LITERAL", "value": float(token)}
    if re.fullmatch(r"[A-Z][A-Z0-9_.]*", token):
        return {"type": "SYMBOL", "value": token}
    raise ValueError(f"argumento ASSERT não suportado em {identifier}: {token}")


def _split_assert_arguments(source: str, identifier: str) -> list[str]:
    arguments: list[str] = []
    current: list[str] = []
    quoted = False
    escaped = False
    for char in source:
        if quoted:
            current.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                quoted = False
            continue
        if char == '"':
            quoted = True
            current.append(char)
        elif char == ",":
            arguments.append("".join(current).strip())
            current = []
        else:
            current.append(char)
    if quoted:
        raise ValueError(f"literal ASSERT não terminado em {identifier}")
    tail = "".join(current).strip()
    if tail:
        arguments.append(tail)
    return arguments


def _parse_assert_call(source: str, identifier: str) -> dict[str, object]:
    match = re.fullmatch(
        r"\s*([A-Z][A-Z0-9_]*)\s*\((.*)\)\s*", source, re.S
    )
    if not match:
        raise ValueError(f"chamada ASSERT inválida em {identifier}")
    return {
        "type": "CALL",
        "name": match.group(1),
        "arguments": [
            _parse_assert_argument(argument, identifier)
            for argument in _split_assert_arguments(match.group(2), identifier)
        ],
    }


def _reject_assert_residual_lines(lines: list[str], identifier: str) -> None:
    ended = False
    seen_fail = False
    seen_manual_review = False
    manual_review_text_pending = False
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if ended:
            if re.fullmatch(r"-{3,}|#.*", stripped):
                continue
            raise ValueError(
                f"conteúdo residual ASSERT após END em {identifier}: {stripped}"
            )
        if manual_review_text_pending:
            if re.fullmatch(r'"(?:[^"\\]|\\.)*"', stripped):
                manual_review_text_pending = False
                continue
            raise ValueError(f"texto MANUAL_REVIEW inválido em {identifier}: {stripped}")
        if stripped == "END":
            ended = True
            continue
        if re.fullmatch(r"FAIL\s+[A-Z][A-Z0-9_]*", stripped):
            if seen_fail:
                raise ValueError(f"FAIL duplicado após ASSERT em {identifier}")
            seen_fail = True
            continue
        if re.fullmatch(r'MANUAL_REVIEW(?:\s+"(?:[^"\\]|\\.)*")?', stripped):
            if seen_manual_review:
                raise ValueError(f"MANUAL_REVIEW duplicado após ASSERT em {identifier}")
            seen_manual_review = True
            manual_review_text_pending = stripped == 'MANUAL_REVIEW'
            continue
        raise ValueError(
            f"conteúdo residual ASSERT não reconhecido em {identifier}: {stripped}"
        )
    if not ended:
        raise ValueError(f"END ausente após ASSERT em {identifier}")
    if manual_review_text_pending:
        raise ValueError(f"texto MANUAL_REVIEW ausente em {identifier}")


def _parse_assert_ir(block: str, identifier: str) -> dict[str, object]:
    declaration = re.search(r"^ASSERT(?:[ \t]+(.*?))?\s*$", block, re.M)
    if not declaration:
        raise ValueError(f"ASSERT ausente em {identifier}")
    inline = (declaration.group(1) or "").strip()
    remainder = block[declaration.end():]

    if inline == "ALL":
        end = re.search(r"^\s*END\s*$", remainder, re.M)
        if not end:
            raise ValueError(f"ASSERT ALL sem END em {identifier}")
        body = remainder[:end.start()]
        calls = list(re.finditer(r"[A-Z][A-Z0-9_]*\s*\([^()]*\)", body, re.S))
        if not calls:
            raise ValueError(f"ASSERT ALL vazio em {identifier}")
        residue = body
        for match in reversed(calls):
            residue = residue[:match.start()] + residue[match.end():]
        if residue.strip():
            raise ValueError(f"conteúdo ASSERT ALL não reconhecido em {identifier}")
        _reject_assert_residual_lines(remainder[end.end():].splitlines(), identifier)
        return {
            "type": "ALL",
            "expressions": [
                _parse_assert_call(match.group(0), identifier) for match in calls
            ],
        }

    if inline == "MANUAL_REVIEW":
        _reject_assert_residual_lines(remainder.splitlines(), identifier)
        return {"type": "LITERAL", "value": "MANUAL_REVIEW"}

    if inline:
        source = inline
        remainder_lines = remainder.splitlines()
        consumed_lines = 0
        if source.count("(") > source.count(")"):
            for index, line in enumerate(remainder_lines):
                source += "\n" + line
                consumed_lines = index + 1
                if source.count("(") == source.count(")"):
                    break
        if source.count("(") != source.count(")"):
            raise ValueError(f"parênteses ASSERT desbalanceados em {identifier}")
        _reject_assert_residual_lines(remainder_lines[consumed_lines:], identifier)
        return _parse_assert_call(source, identifier)

    expression_lines: list[str] = []
    remainder_lines = remainder.splitlines()
    trailing_lines: list[str] = []
    for index, line in enumerate(remainder_lines):
        stripped = line.strip()
        if not stripped:
            continue
        if stripped == "END" or re.match(r"^(?:FAIL|MANUAL_REVIEW)\b", stripped):
            trailing_lines = remainder_lines[index:]
            break
        expression_lines.append(stripped)
    if not expression_lines:
        raise ValueError(f"ASSERT vazio em {identifier}")
    if "OR MANUAL_REVIEW" in expression_lines:
        if expression_lines.count("OR MANUAL_REVIEW") != 1 or \
                expression_lines[-1] != "OR MANUAL_REVIEW":
            raise ValueError(f"OR MANUAL_REVIEW ambíguo em {identifier}")
        _reject_assert_residual_lines(trailing_lines, identifier)
        call = _parse_assert_call(
            "\n".join(expression_lines[:-1]), identifier
        )
        return {
            "type": "OR",
            "expressions": [
                call,
                {"type": "LITERAL", "value": "MANUAL_REVIEW"},
            ],
        }
    _reject_assert_residual_lines(trailing_lines, identifier)
    return _parse_assert_call("\n".join(expression_lines), identifier)


def parse_entity_catalog(text: str) -> dict[str, dict[str, object]]:
    """Compile only the entity fields consumed by RDE projection/applicability."""
    catalog: dict[str, dict[str, object]] = {}
    for entity_id, block in _blocks(text, "ENTITY"):
        entity_type = _single_field(block, "TYPE", entity_id, required=True)
        attributes: dict[str, str] = {}
        for name, value_type in re.findall(r"^ATTRIBUTE\s+(\S+)\s+(\S+)\s*$", block, re.M):
            if name in attributes:
                raise ValueError(f"ATTRIBUTE duplicado em {entity_id}: {name}")
            attributes[name] = value_type
        if any(value not in {"BOOLEAN", "DATE", "ENUM", "TEXT"} for value in attributes.values()):
            raise ValueError(f"ATTRIBUTE_TYPE incompatível com RDE em {entity_id}")
        item: dict[str, object] = {
            "TYPE": entity_type,
            "ATTRIBUTES": list(attributes),
            "ATTRIBUTE_TYPES": attributes,
        }
        official_code = _single_field(block, "OFFICIAL_ESCI_CODE", entity_id)
        target_class = _single_field(block, "APPLICABILITY_TARGET_CLASS", entity_id)
        if official_code is not None:
            item["OFFICIAL_ESCI_CODE"] = official_code
        if target_class is not None:
            item["APPLICABILITY_TARGET_CLASS"] = target_class
        catalog[entity_id] = item
    return catalog


def _parse_nonconformities(text: str) -> dict[str, dict[str, str]]:
    return {
        identifier: {
            "TABLE": _single_field(block, "TABLE", identifier, required=True),
            "REF_REQUIREMENT": _single_field(block, "REF_REQUIREMENT", identifier, required=True),
            "REF_CRITERION": _single_field(block, "REF_CRITERION", identifier, required=True),
        }
        for identifier, block in _blocks(text, "NONCONFORMITY")
    }


def _parse_requirement_metadata(text: str) -> list[dict[str, object]]:
    requirements = []
    for identifier, block in _blocks(text, "REQUIREMENT"):
        item: dict[str, object] = {"requirementId": identifier}
        for source, target in (
            ("TABLE", "table"),
            ("SMSCI", "smsci"),
            ("IN19_DOCUMENTATION_REGIME", "in19DocumentationRegime"),
            ("FOR_EACH", "forEach"),
        ):
            value = _single_field(block, source, identifier, required=source == "TABLE")
            if value is not None:
                item[target] = value
        item["validate"] = _field_list(block, "VALIDATE")
        item["nonconformities"] = _field_list(block, "NONCONFORMITY")
        requirements.append(item)
    return requirements


def _parse_criterion_metadata(
    *criteria_texts: str,
    source_names: tuple[str, ...] | None = None,
) -> list[dict[str, object]]:
    if source_names is not None and len(source_names) != len(criteria_texts):
        raise ValueError("source_names deve corresponder às fontes de Criteria")
    criteria = []
    seen = set()
    for source_index, text in enumerate(criteria_texts):
        for identifier, block in _blocks(text, "CRITERION"):
            if identifier in seen:
                raise ValueError(f"CRITERION duplicado: {identifier}")
            seen.add(identifier)
            associations = _field_list(block, "USES") + _field_list(block, "REQUIREMENT")
            if len(associations) != 1:
                raise ValueError(f"associação Requirement ausente ou ambígua em {identifier}")
            item: dict[str, object] = {
                "criterionId": identifier,
                "requirementId": associations[0],
                "table": _single_field(block, "TABLE", identifier, required=True),
                "failNonconformities": _field_list(block, "FAIL"),
                "validate": _field_list(block, "VALIDATE"),
                "forEach": _single_field(block, "FOR_EACH", identifier),
            }
            for source, target in (("CONTEXT", "context"), ("APPLIES_TO", "appliesTo")):
                value = _single_field(block, source, identifier)
                if value is not None:
                    item[target] = value
            item["assertIr"] = _parse_assert_ir(block, identifier)
            if source_names is not None:
                item["sourceFile"] = source_names[source_index]
            criteria.append(item)
    return criteria

def _parse_official_code_map(text: str) -> list[dict[str, str]]:
    heading = re.search(r"^OFFICIAL_ESCI_CODE -> CANONICAL_ENTITY\s*$", text, re.M)
    if not heading:
        raise ValueError("seção OFFICIAL_ESCI_CODE -> CANONICAL_ENTITY ausente")
    mapping_text = text[heading.end() :].split("\n\nOnly entities", 1)[0]
    mapping = [
        {"code": code, "entityId": entity_id}
        for code, entity_id in re.findall(r"^(\S+)\s*->\s*(\S+)\s*$", mapping_text, re.M)
    ]
    if not mapping or len({item["code"] for item in mapping}) != len(mapping):
        raise ValueError("mapa OFFICIAL_ESCI_CODE ausente ou duplicado")
    return mapping


def _parse_structured_execution_index(index: str) -> list[dict[str, object]]:
    result = []
    for requirement_id, block in _blocks(index, "REQUIREMENT"):
        unit_lines = re.findall(r"^\s*(UNIT_KEY\s+\([^\n]+\))\s*$", block, re.M)
        if not unit_lines:
            raise ValueError(f"COMPILED_EXECUTION_INDEX sem UNIT_KEY: {requirement_id}")
        units = []
        for unit_line in unit_lines:
            match = re.fullmatch(r"UNIT_KEY\s+\(([^,]+),\s*([^)]+)\)", unit_line)
            if not match:
                raise ValueError(f"UNIT_KEY inválida: {unit_line}")
            unit_requirement, criterion_id = (part.strip() for part in match.groups())
            if unit_requirement != requirement_id:
                raise ValueError(f"UNIT_KEY referencia Requirement diferente: {unit_line}")
            units.append({
                "unitKey": unit_line,
                "requirementId": unit_requirement,
                "criterionId": criterion_id,
            })
        iteration_sources = re.findall(r"^[ \t]*ITERATION_SOURCE\s+(.+?)\s*$", block, re.M)
        if len(iteration_sources) > 1:
            raise ValueError(f"ITERATION_SOURCE ambíguo em {requirement_id}")
        result.append({
            "requirementId": requirement_id,
            "iterationSource": iteration_sources[0] if iteration_sources else None,
            "units": units,
        })
    return result


def compile_runtime_contract() -> dict[str, object]:
    """Derive the small immutable JavaScript contract from canonical sources."""
    pipeline_text = PIPELINE.read_text(encoding="utf-8")
    manifest = parse_manifest(pipeline_text)
    requirement_text = REQUIREMENTS.read_text(encoding="utf-8")
    criteria_texts = tuple(path.read_text(encoding="utf-8") for path in CRITERIA_SOURCES)
    entities = parse_entity_catalog(ENTITIES.read_text(encoding="utf-8"))
    requirements = _parse_requirement_metadata(requirement_text)
    criteria = _parse_criterion_metadata(
        *criteria_texts,
        source_names=tuple(path.name for path in CRITERIA_SOURCES),
    )
    nonconformities = _parse_nonconformities(NONCONFORMITIES.read_text(encoding="utf-8"))
    official_map = _parse_official_code_map(APPLICABILITY.read_text(encoding="utf-8"))
    execution_index_text = compile_execution_index(requirement_text, *criteria_texts)
    execution_index = _parse_structured_execution_index(execution_index_text)

    requirement_ids = {item["requirementId"] for item in requirements}
    criterion_by_id = {item["criterionId"]: item for item in criteria}
    criterion_ids = set(criterion_by_id)
    if set(entities) == set():
        raise ValueError("catálogo de entidades vazio")
    for item in requirements:
        if item.get("smsci") and item["smsci"] not in entities:
            raise ValueError(f"SMSCI inexistente em {item['requirementId']}: {item['smsci']}")
        for nc_id in item["nonconformities"]:
            if nc_id not in nonconformities:
                raise ValueError(f"Nonconformity inexistente em {item['requirementId']}: {nc_id}")
            if nonconformities[nc_id]["REF_REQUIREMENT"] != item["requirementId"]:
                raise ValueError(f"REF_REQUIREMENT incompatível: {nc_id}")
    for criterion in criteria:
        if criterion["requirementId"] not in requirement_ids:
            raise ValueError(f"Requirement inexistente em {criterion['criterionId']}")
        applies_to = criterion.get("appliesTo")
        if applies_to and applies_to not in entities:
            raise ValueError(f"APPLIES_TO inexistente em {criterion['criterionId']}: {applies_to}")
        requirement = next(item for item in requirements
                           if item["requirementId"] == criterion["requirementId"])
        if applies_to is not None and requirement.get("smsci") != applies_to:
            raise ValueError(
                f"APPLIES_TO diverge do SMSCI do Requirement em {criterion['criterionId']}"
            )
        for nc_id in criterion["failNonconformities"]:
            if nc_id not in nonconformities:
                raise ValueError(f"Nonconformity inexistente em {criterion['criterionId']}: {nc_id}")
            nc = nonconformities[nc_id]
            if nc["REF_CRITERION"] != criterion["criterionId"] or \
                    nc["REF_REQUIREMENT"] != criterion["requirementId"]:
                raise ValueError(f"Referências de Nonconformity incompatíveis: {nc_id}")
            if nc["TABLE"] != criterion["table"]:
                raise ValueError(f"TABLE de Nonconformity incompatível com Criterion: {nc_id}")
    for nc_id, refs in nonconformities.items():
        if refs["REF_REQUIREMENT"] not in requirement_ids:
            raise ValueError(f"REF_REQUIREMENT inexistente em {nc_id}")
        if refs["REF_CRITERION"] not in criterion_ids:
            raise ValueError(f"REF_CRITERION inexistente em {nc_id}")
        if criterion_by_id[refs["REF_CRITERION"]]["requirementId"] != refs["REF_REQUIREMENT"]:
            raise ValueError(f"Associação Requirement/Criterion incompatível em {nc_id}")
        if criterion_by_id[refs["REF_CRITERION"]]["table"] != refs["TABLE"]:
            raise ValueError(f"TABLE de Nonconformity incompatível com Criterion: {nc_id}")

    entities_by_code = {
        item["OFFICIAL_ESCI_CODE"]: (entity_id, item)
        for entity_id, item in entities.items()
        if item.get("OFFICIAL_ESCI_CODE")
    }
    declared_official = {
        code: entity_id for code, (entity_id, item) in entities_by_code.items()
        if item.get("APPLICABILITY_TARGET_CLASS") == "OFFICIAL_ESCI_SCOPE"
    }
    compiled_official = {item["code"]: item["entityId"] for item in official_map}
    if compiled_official != declared_official:
        raise ValueError("mapa oficial diverge de OFFICIAL_ESCI_CODE/APPLICABILITY_TARGET_CLASS")
    for mapping in official_map:
        entity = entities.get(mapping["entityId"])
        if not entity or entity.get("OFFICIAL_ESCI_CODE") != mapping["code"] or \
                entity.get("APPLICABILITY_TARGET_CLASS") != "OFFICIAL_ESCI_SCOPE":
            raise ValueError(f"mapeamento OFFICIAL_ESCI_CODE inválido: {mapping}")

    structured_by_requirement = {item["requirementId"]: item for item in execution_index}
    if list(structured_by_requirement) != [item["requirementId"] for item in requirements]:
        raise ValueError("ordem de Requirement difere entre índice e fonte canônica")
    for block in execution_index:
        for unit in block["units"]:
            criterion = criterion_by_id.get(unit["criterionId"])
            if not criterion or criterion["requirementId"] != block["requirementId"]:
                raise ValueError(f"associação do índice inválida: {unit['unitKey']}")

    return {
        "contractVersion": 1,
        "knowledgeBase": {
            "id": re.search(r"^KNOWLEDGE_BASE_ID:\s*(\S+)", pipeline_text, re.M).group(1),
            "version": re.search(r"^KNOWLEDGE_BASE_VERSION:\s*(\S+)", pipeline_text, re.M).group(1),
            "documentVersions": dict(manifest),
        },
        "entityCatalog": entities,
        "officialEsciTargets": official_map,
        "requirements": requirements,
        "criteria": criteria,
        "nonconformities": nonconformities,
        "compiledExecutionIndex": execution_index,
    }


def render_runtime_contract() -> str:
    """Render a deterministic, deeply frozen and runtime-authenticated artifact."""
    payload = json.dumps(compile_runtime_contract(), ensure_ascii=False, separators=(",", ":"))
    return (
        "/* GENERATED_DERIVED_ARTIFACT: DO NOT EDIT. Regenerate with "
        "python tools/build_knowledge_base_release.py --write-runtime-contract. */\n"
        "/* DO_NOT_EDIT_AS_NORMATIVE_SOURCE. Sources are identified in knowledgeBase. */\n"
        "(function (global, value) {\n"
        "  function freeze(node) {\n"
        "    if (node && typeof node === 'object' && !Object.isFrozen(node)) {\n"
        "      Object.keys(node).forEach(function (key) { freeze(node[key]); });\n"
        "      Object.freeze(node);\n"
        "    }\n"
        "    return node;\n"
        "  }\n"
        "  var canonical = freeze(value);\n"
        "  var canonicalContracts = new WeakSet();\n"
        "  canonicalContracts.add(canonical);\n"
        "  Object.defineProperty(global, 'COMPILED_RUNTIME_CONTRACT', {\n"
        "    value: canonical, enumerable: true, writable: false, configurable: false\n"
        "  });\n"
        "  Object.defineProperty(global, 'isCanonicalCompiledRuntimeContract', {\n"
        "    value: function (candidate) { return canonicalContracts.has(candidate); },\n"
        "    enumerable: false, writable: false, configurable: false\n"
        "  });\n"
        "  if (typeof module !== 'undefined' && module.exports) {\n"
        "    module.exports = canonical;\n"
        "  }\n"
        f"}})(globalThis, {payload});\n"
    )

def validate_runtime_contract_artifact() -> None:
    expected = render_runtime_contract().encode("utf-8")
    if not RUNTIME_CONTRACT.is_file() or RUNTIME_CONTRACT.read_bytes() != expected:
        raise RuntimeError("CompiledRuntimeContract.js diverge das fontes canônicas")


def inject_compiled_execution_index(pipeline_text: str, index: str) -> str:
    """Insert the generated index only in the deployable pipeline copy."""
    if any(sentinel in pipeline_text for sentinel in DERIVED_ARTIFACT_SENTINELS):
        raise ValueError("a fonte 08 não pode conter sentinelas de artefato derivado")
    markers = list(re.finditer(r"^# PHASE 4C\s*$", pipeline_text, re.M))
    if len(markers) != 1:
        raise ValueError("ponto de injeção # PHASE 4C ausente ou ambíguo")
    marker = markers[0]
    return (
        pipeline_text[: marker.start()]
        + index.rstrip()
        + "\n\n###############################################################################\n"
        + pipeline_text[marker.start() :]
    )


def build(output: Path) -> None:
    if git("status", "--porcelain"):
        raise RuntimeError("a release exige um worktree limpo")
    validate_runtime_contract_artifact()

    source_commit = git("rev-parse", "HEAD")
    pipeline_text = PIPELINE.read_text(encoding="utf-8")
    compiled_index = compile_execution_index(
        REQUIREMENTS.read_text(encoding="utf-8"),
        *(path.read_text(encoding="utf-8") for path in CRITERIA_SOURCES),
    )
    pipeline_text = inject_compiled_execution_index(pipeline_text, compiled_index)
    manifest = parse_manifest(pipeline_text)
    actual = {path.name for path in KNOWLEDGE_BASE.glob("*.txt")}
    if set(manifest) != actual:
        raise RuntimeError("DOCUMENT_SET difere dos documentos carregáveis")

    if output.exists():
        raise FileExistsError(f"diretório de saída já existe: {output}")
    output.mkdir(parents=True)

    for filename, version in manifest.items():
        text = pipeline_text if filename == PIPELINE.name else (KNOWLEDGE_BASE / filename).read_text(encoding="utf-8")
        text = inject_document_version(text, version)
        if filename == PIPELINE.name:
            text = text.replace(
                f"SOURCE_COMMIT: {PLACEHOLDER}",
                f"SOURCE_COMMIT: {source_commit}",
                1,
            )
        (output / filename).write_text(text, encoding="utf-8")

    if len(list(output.glob("*.txt"))) != 10:
        shutil.rmtree(output)
        raise RuntimeError("a release não contém exatamente 10 documentos")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path, nargs="?")
    parser.add_argument("--write-runtime-contract", action="store_true")
    args = parser.parse_args()
    if args.write_runtime_contract:
        RUNTIME_CONTRACT.write_text(render_runtime_contract(), encoding="utf-8")
        return
    if args.output is None:
        parser.error("informe o diretório de release ou --write-runtime-contract")
    build(args.output.resolve())


if __name__ == "__main__":
    main()
