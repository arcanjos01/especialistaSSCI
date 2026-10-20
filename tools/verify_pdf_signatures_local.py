#!/usr/bin/env python3
"""Experimental, local-only PDF signature inspection via Poppler pdfsig.

This tool reports cryptographic signature coverage/integrity only.  It is not an
Engine, trust, certificate-chain, revocation, PAdES, or professional-identity
verifier, and it never modifies the input PDF.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import shutil
import tempfile
from pathlib import Path
from typing import Any


SUPPORTED_PDF_SIG_VERSION = "24.02.0"
VERIFIER_VERSION = "local-pdf-signature-verifier/1.0"
_RANGE_RE = re.compile(r"\[(\d+)\s+-\s+(\d+)\]")
_RANGES_LINE_RE = re.compile(r"\s*\[\d+\s+-\s+\d+\](?:\s*,\s*\[\d+\s+-\s+\d+\])*\s*")
_VERSION_RE = re.compile(r"pdfsig version (\S+)")
_KNOWN_PREFIXES = (
    "Digital Signature Info of:", "Signature #", "  - ",
    "  - Signature Validation:", "  - Total document signed",
)


class PdfSignatureError(ValueError):
    pass


def _run_pdfsig(path: Path, data: bytes) -> tuple[str, int]:
    env = os.environ.copy()
    env["LC_ALL"] = "C"
    try:
        version = subprocess.run(
            ["pdfsig", "-v"], text=True, capture_output=True, env=env, check=False, timeout=60
        )
    except subprocess.TimeoutExpired as exc:
        raise PdfSignatureError("pdfsig version check timed out after 60 seconds") from exc
    version_text = (version.stdout or "") + (version.stderr or "")
    match = _VERSION_RE.fullmatch(version_text.strip().splitlines()[0]) if version_text.strip() else None
    if version.returncode != 0 or not match or match.group(1) != SUPPORTED_PDF_SIG_VERSION:
        raise PdfSignatureError("unsupported or unexpected pdfsig version")
    try:
        with tempfile.TemporaryDirectory(prefix="ssci-pdfsig-") as directory:
            fixed_pdf = Path(directory) / "input.pdf"
            fixed_pdf.write_bytes(data)
            dump = subprocess.run(
                ["pdfsig", "-nocert", "-no-ocsp", "-dump", "input.pdf"],
                text=True, capture_output=True, cwd=directory, env=env, check=False, timeout=60,
            )
            dump_text = ((dump.stdout or "") + (dump.stderr or "")).strip()
            no_signature = f"File 'input.pdf' does not contain any signatures"
            if dump.returncode == 2 and dump_text == no_signature:
                dump_count = 0
            elif dump.returncode != 0:
                raise PdfSignatureError("pdfsig dump failed")
            else:
                dumped = list(Path(directory).glob("input.pdf.sig*"))
                if any(not item.is_file() for item in dumped):
                    raise PdfSignatureError("pdfsig dump produced an unexpected entry")
                dump_count = len(dumped)
            result = subprocess.run(
                ["pdfsig", "-nocert", "-no-ocsp", "input.pdf"],
                text=True, capture_output=True, cwd=directory, env=env, check=False, timeout=60,
            )
            combined = ((result.stdout or "") + (result.stderr or "")).strip()
            if result.returncode == 2 and combined == "File 'input.pdf' does not contain any signatures":
                return "No signatures.", dump_count
            if result.returncode != 0:
                raise PdfSignatureError("pdfsig verification failed")
            return result.stdout, dump_count
    except subprocess.TimeoutExpired as exc:
        raise PdfSignatureError("pdfsig execution timed out after 60 seconds") from exc


def _parse_ranges(value: str) -> list[list[int]]:
    if not _RANGES_LINE_RE.fullmatch(value):
        raise PdfSignatureError("unexpected signed ranges")
    ranges = [[int(a), int(b)] for a, b in _RANGE_RE.findall(value)]
    if not ranges or "[" not in value:
        raise PdfSignatureError("unexpected signed ranges")
    return ranges


def parse_pdfsig_output(output: str, document_size: int) -> list[dict[str, Any]]:
    """Parse the C-locale pdfsig 24.02.0 report, failing closed on drift."""
    lines = output.splitlines()
    if not lines or not lines[0].startswith("Digital Signature Info of:"):
        if output.strip() == "No signatures.":
            return []
        raise PdfSignatureError("unexpected pdfsig output header")
    signatures: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    for raw in lines[1:]:
        line = raw.strip()
        if not line:
            continue
        if line.startswith("Signature #"):
            if current is not None:
                signatures.append(_finish(current, document_size))
            current = {}
            continue
        if current is None:
            raise PdfSignatureError("unexpected pdfsig output before signature")
        fields = {
            "Signature Field Name:": "field",
            "Signer Certificate Common Name:": "signer_cn",
            "Signing Time:": "signing_time_literal",
            "Signing Hash Algorithm:": "hash_algorithm",
            "Signature Type:": "signature_type",
        }
        matched = False
        for marker, key in fields.items():
            if line.startswith("- " + marker):
                if key in current:
                    raise PdfSignatureError("duplicate pdfsig signature field: " + key)
                current[key] = line[len(marker) + 2:].strip()
                matched = True
                break
        if line.startswith("- Signed Ranges:"):
            if "signed_ranges" in current:
                raise PdfSignatureError("duplicate pdfsig signature field: signed_ranges")
            current["signed_ranges"] = _parse_ranges(line.split(":", 1)[1].strip())
            matched = True
        elif line.startswith("- Signer full Distinguished Name:"):
            matched = True
        elif line in ("- Total document signed", "- Not total document signed"):
            if "total_document_signed_reported" in current:
                raise PdfSignatureError("duplicate pdfsig signature status")
            current["total_document_signed_reported"] = True
            current["total_document_signed"] = line == "- Total document signed"
            matched = True
        elif line.startswith("- Signature Validation:"):
            if "integrity" in current:
                raise PdfSignatureError("duplicate pdfsig signature field: integrity")
            value = line.split(":", 1)[1].strip()
            current["integrity"] = {
                "valid": True if value == "Signature is Valid." else False if value in ("Signature is Invalid.", "Digest Mismatch.") else None,
                "result": "VALID" if value == "Signature is Valid." else "INVALID" if value in ("Signature is Invalid.", "Digest Mismatch.") else "UNKNOWN/NOT_EVALUATED",
                "result_literal": value,
            }
            matched = True
        if not matched:
            raise PdfSignatureError("unexpected pdfsig output line")
    if current is not None:
        signatures.append(_finish(current, document_size))
    if not signatures:
        raise PdfSignatureError("pdfsig report contains no parsed signatures")
    return signatures


def _finish(item: dict[str, Any], document_size: int) -> dict[str, Any]:
    required = ("field", "signer_cn", "signing_time_literal", "hash_algorithm", "signature_type", "signed_ranges", "integrity", "total_document_signed")
    if any(key not in item for key in required):
        raise PdfSignatureError("incomplete pdfsig signature record")
    ranges = item["signed_ranges"]
    if any(start < 0 or end < start or end > document_size for start, end in ranges):
        raise PdfSignatureError("signed range outside document")
    if any(start < previous_end for (_, previous_end), (start, _) in zip(ranges, ranges[1:])):
        raise PdfSignatureError("overlapping signed ranges")
    covered = sum(end - start for start, end in ranges)
    full_document = ranges[0][0] == 0 and ranges[-1][1] == document_size
    if item["total_document_signed"] != full_document:
        raise PdfSignatureError("pdfsig total-document status conflicts with signed ranges")
    item["coverage"] = {"signed_bytes": covered, "document_size": document_size, "full_document_current_revision": full_document}
    return item


def inspect_pdf(path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    report, cryptographic_count = _run_pdfsig(path, data)
    signatures = parse_pdfsig_output(report, len(data))
    if len(signatures) != cryptographic_count:
        raise PdfSignatureError("pdfsig record count differs from dumped signature count")
    return {
        "verifier_version": VERIFIER_VERSION,
        "pdfsig_version": SUPPORTED_PDF_SIG_VERSION,
        "document": {"path": str(path), "size": len(data), "sha256": hashlib.sha256(data).hexdigest()},
        "signature_count": len(signatures),
        "signatures": signatures,
        "trust": "UNKNOWN/NOT_EVALUATED",
        "certificate_chain": "UNKNOWN/NOT_EVALUATED",
        "revocation": "UNKNOWN/NOT_EVALUATED",
        "pades": "UNKNOWN/NOT_EVALUATED",
        "professional_identity": "UNKNOWN/NOT_EVALUATED",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    args = parser.parse_args(argv)
    try:
        result = inspect_pdf(args.pdf)
    except (OSError, PdfSignatureError, FileNotFoundError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
