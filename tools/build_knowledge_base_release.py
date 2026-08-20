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


def build(output: Path) -> None:
    if git("status", "--porcelain"):
        raise RuntimeError("a release exige um worktree limpo")

    source_commit = git("rev-parse", "HEAD")
    pipeline_text = PIPELINE.read_text(encoding="utf-8")
    manifest = parse_manifest(pipeline_text)
    actual = {path.name for path in KNOWLEDGE_BASE.glob("*.txt")}
    if set(manifest) != actual:
        raise RuntimeError("DOCUMENT_SET difere dos documentos carregáveis")

    if output.exists():
        raise FileExistsError(f"diretório de saída já existe: {output}")
    output.mkdir(parents=True)

    for filename, version in manifest.items():
        text = (KNOWLEDGE_BASE / filename).read_text(encoding="utf-8")
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
