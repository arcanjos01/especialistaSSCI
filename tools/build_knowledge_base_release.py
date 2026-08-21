#!/usr/bin/env python3
"""Build the ten-document deployable Knowledge Base release."""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KNOWLEDGE_BASE = ROOT / "knowledge-base"
PIPELINE = KNOWLEDGE_BASE / "08_execution_pipeline.txt"
PLACEHOLDER = "RELEASE_BUILD_REQUIRED"
REQUIREMENTS = KNOWLEDGE_BASE / "02_requirements.txt"
CRITERIA_SOURCES = (
    KNOWLEDGE_BASE / "03_table1.txt",
    KNOWLEDGE_BASE / "04_table4.txt",
)
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
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    build(args.output.resolve())


if __name__ == "__main__":
    main()
