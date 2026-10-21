#!/usr/bin/env python3
"""Experimental, local-only PDF signature inspection via Poppler pdfsig.

This tool reports CMS integrity and signed-revision coverage and can optionally
check a certificate path against an explicitly supplied PEM anchor bundle. The
path result is diagnostic: it does not establish an approved trust policy,
revocation, PAdES validity, or professional identity. The tool is not an Engine,
emits no authenticated receipt, and never modifies the input PDF.
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
VERIFIER_VERSION = "local-pdf-signature-verifier/1.3"
_RANGE_RE = re.compile(r"\[(\d+)\s+-\s+(\d+)\]")
_RANGES_LINE_RE = re.compile(r"\s*\[\d+\s+-\s+\d+\](?:\s*,\s*\[\d+\s+-\s+\d+\])*\s*")
_VERSION_RE = re.compile(r"pdfsig version (\S+)")
_DUMP_RE = re.compile(r"input\.pdf\.sig(\d+)")
_KNOWN_PREFIXES = (
    "Digital Signature Info of:", "Signature #", "  - ",
    "  - Signature Validation:", "  - Total document signed",
)


class PdfSignatureError(ValueError):
    pass


def _dump_sort_key(path: Path) -> int:
    match = _DUMP_RE.fullmatch(path.name)
    if not match:
        raise PdfSignatureError("pdfsig dump produced an unexpected entry")
    return int(match.group(1))


def _resolve_executable(name: str) -> Path:
    located = shutil.which(name)
    if not located:
        raise PdfSignatureError(f"required verifier executable is unavailable: {name}")
    try:
        path = Path(located).resolve(strict=True)
    except OSError as exc:
        raise PdfSignatureError(f"required verifier executable is unavailable: {name}") from exc
    if not path.is_file():
        raise PdfSignatureError(f"required verifier executable is not a file: {name}")
    return path


def _executable_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    try:
        with path.open("rb") as executable:
            for chunk in iter(lambda: executable.read(1024 * 1024), b""):
                digest.update(chunk)
    except OSError as exc:
        raise PdfSignatureError("verifier executable bytes are unavailable") from exc
    return digest.hexdigest()


def _openssl_version(executable: Path | None = None) -> str:
    openssl = executable or _resolve_executable("openssl")
    try:
        result = subprocess.run(
            [str(openssl), "version"], text=True, capture_output=True, check=False, timeout=60
        )
    except (OSError, subprocess.TimeoutExpired):
        return "UNKNOWN/NOT_EVALUATED"
    line = (result.stdout or "").strip().splitlines()
    if result.returncode != 0 or not line or not line[0].startswith("OpenSSL "):
        return "UNKNOWN/NOT_EVALUATED"
    return line[0]


def _run_pdfsig(
    path: Path, data: bytes, executable: Path | None = None
) -> tuple[str, int, list[bytes], str]:
    pdfsig = executable or _resolve_executable("pdfsig")
    env = os.environ.copy()
    env["LC_ALL"] = "C"
    try:
        version = subprocess.run(
            [str(pdfsig), "-v"], text=True, capture_output=True, env=env, check=False, timeout=60
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
                [str(pdfsig), "-nocert", "-no-ocsp", "-dump", "input.pdf"],
                text=True, capture_output=True, cwd=directory, env=env, check=False, timeout=60,
            )
            dump_text = ((dump.stdout or "") + (dump.stderr or "")).strip()
            no_signature = f"File 'input.pdf' does not contain any signatures"
            dumped: list[Path] = []
            if dump.returncode == 2 and dump_text == no_signature:
                dump_count = 0
            elif dump.returncode != 0:
                raise PdfSignatureError("pdfsig dump failed")
            else:
                dumped = sorted(Path(directory).glob("input.pdf.sig*"), key=_dump_sort_key)
                expected = [Path(directory) / f"input.pdf.sig{index}" for index in range(len(dumped))]
                if dumped != expected or any(not item.is_file() for item in dumped):
                    raise PdfSignatureError("pdfsig dump produced an unexpected entry")
                dump_count = len(dumped)
            result = subprocess.run(
                [str(pdfsig), "-nocert", "-no-ocsp", "input.pdf"],
                text=True, capture_output=True, cwd=directory, env=env, check=False, timeout=60,
            )
            combined = ((result.stdout or "") + (result.stderr or "")).strip()
            if result.returncode == 2 and combined == "File 'input.pdf' does not contain any signatures":
                return "No signatures.", dump_count, [], match.group(1)
            if result.returncode != 0:
                raise PdfSignatureError("pdfsig verification failed")
            return result.stdout, dump_count, [item.read_bytes() for item in dumped], match.group(1)
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


def _der_length(data: bytes) -> int:
    if len(data) < 2 or data[0] != 0x30:
        raise PdfSignatureError("CMS dump is not DER")
    first = data[1]
    if first < 0x80:
        length_bytes = 0
        length = first
    else:
        length_bytes = first & 0x7F
        if length_bytes == 0 or length_bytes > 4 or len(data) < 2 + length_bytes:
            raise PdfSignatureError("CMS DER length is malformed")
        if data[2] == 0:
            raise PdfSignatureError("CMS DER length is noncanonical")
        length = int.from_bytes(data[2:2 + length_bytes], "big")
        if length < 0x80:
            raise PdfSignatureError("CMS DER length is noncanonical")
    header = 2 + length_bytes
    total = header + length
    if total > len(data):
        raise PdfSignatureError("CMS DER is truncated")
    return total


def _cms_cross_check(
    data: bytes, signatures: list[dict[str, Any]], dumps: list[bytes],
    openssl_executable: Path | None = None,
) -> list[dict[str, str]]:
    if len(dumps) != len(signatures):
        raise PdfSignatureError("pdfsig dump and parsed records are not a 1:1 ordered match")
    # The report-to-dump ordering contract is not independently proven for multi-signature PDFs.
    if len(signatures) > 1:
        return [{"name": "CMS_SIGNATURE_INTEGRITY", "result": "INCONCLUSIVE"} for _ in signatures]
    openssl = openssl_executable or _resolve_executable("openssl")
    with tempfile.TemporaryDirectory(prefix="ssci-cms-") as directory_name:
        directory = Path(directory_name)
        return _cms_cross_check_in_directory(directory, data, signatures, dumps, openssl)


def _cms_cross_check_in_directory(
    directory: Path, data: bytes, signatures: list[dict[str, Any]],
    dumps: list[bytes], openssl_executable: Path,
) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    for index, (dump, signature) in enumerate(zip(dumps, signatures)):
        try:
            cms = dump
            cms_length = _der_length(cms)
            if any(cms[cms_length:]):
                raise PdfSignatureError("CMS dump has nonzero trailing bytes")
            cms = cms[:cms_length]
            content = b"".join(data[start:end] for start, end in signature["signed_ranges"])
            content_path = directory / f"cms-content-{index}.bin"
            cms_path = directory / f"cms-{index}.der"
            content_path.write_bytes(content)
            cms_path.write_bytes(cms)
            verified = subprocess.run(
                [str(openssl_executable), "cms", "-verify", "-binary", "-noverify", "-verify_retcode",
                 "-inform", "DER", "-in", cms_path.name, "-content", content_path.name,
                 "-out", os.devnull], cwd=directory, text=True, capture_output=True,
                check=False, timeout=60,
            )
            pdfsig_valid = signature["integrity"]["valid"] is True
            if verified.returncode == 0 and pdfsig_valid:
                result = "VALID"
            elif verified.returncode != 0:
                result = "INCONCLUSIVE"
            else:
                result = "INCONCLUSIVE"
        except (OSError, PdfSignatureError, subprocess.TimeoutExpired):
            result = "INCONCLUSIVE"
        results.append({"name": "CMS_SIGNATURE_INTEGRITY", "result": result})
    return results


def _verify_certificate_chain(
    directory: Path,
    data: bytes,
    signature: dict[str, Any],
    cms_dump: bytes,
    trust_anchor_bundle: bytes,
    signature_integrity: dict[str, str],
    openssl_executable: Path | None = None,
) -> dict[str, str]:
    if signature_integrity.get("result") != "VALID":
        return {"result": "NOT_EVALUATED_INTEGRITY_NOT_CONFIRMED"}
    try:
        openssl = openssl_executable or _resolve_executable("openssl")
        cms_length = _der_length(cms_dump)
        if any(cms_dump[cms_length:]):
            raise PdfSignatureError("CMS dump has nonzero trailing bytes")
        cms_path = directory / "chain-check.der"
        content_path = directory / "chain-check-content.bin"
        anchors_path = directory / "trust-anchors.pem"
        cms_path.write_bytes(cms_dump[:cms_length])
        content_path.write_bytes(b"".join(
            data[start:end] for start, end in signature["signed_ranges"]
        ))
        anchors_path.write_bytes(trust_anchor_bundle)
        # OpenSSL otherwise augments -CAfile with ambient default sources such
        # as SSL_CERT_DIR / the system CA store. This result claims validation
        # against the supplied bundle only, so those sources must be disabled.
        openssl_env = os.environ.copy()
        openssl_env.pop("SSL_CERT_FILE", None)
        openssl_env.pop("SSL_CERT_DIR", None)
        checked = subprocess.run(
            [str(openssl), "cms", "-verify", "-binary", "-verify_retcode",
             "-no-CApath", "-no-CAstore",
             "-inform", "DER", "-in", cms_path.name, "-content",
             content_path.name, "-CAfile", anchors_path.name, "-out", os.devnull],
            cwd=directory, env=openssl_env, text=True, capture_output=True,
            check=False, timeout=60,
        )
    except (OSError, PdfSignatureError, subprocess.TimeoutExpired):
        return {"result": "INCONCLUSIVE"}
    if checked.returncode == 0:
        return {"result": "VALID_TO_SUPPLIED_TRUST_ANCHOR_BUNDLE"}
    return {"result": "NOT_VALIDATED_TO_SUPPLIED_TRUST_ANCHOR_BUNDLE"}


def inspect_pdf(
    path: Path, *, trust_anchor_bundle: Path | None = None
) -> dict[str, Any]:
    data = path.read_bytes()
    trust_anchors = trust_anchor_bundle.read_bytes() if trust_anchor_bundle else None
    if trust_anchors is not None and not trust_anchors.strip():
        raise PdfSignatureError("trust-anchor bundle is empty")
    if trust_anchors is not None and (
        b"-----BEGIN CERTIFICATE-----" not in trust_anchors
        or b"PRIVATE KEY-----" in trust_anchors
    ):
        raise PdfSignatureError("trust-anchor bundle must contain public certificates only")
    pdfsig_executable = _resolve_executable("pdfsig")
    openssl_executable = _resolve_executable("openssl")
    component_digests_before = {
        "pdfsig_executable_sha256": _executable_sha256(pdfsig_executable),
        "openssl_executable_sha256": _executable_sha256(openssl_executable),
    }
    openssl_version = _openssl_version(openssl_executable)
    run_result = _run_pdfsig(path, data, pdfsig_executable)
    if len(run_result) == 2:  # compatibility with focused mocks of the legacy helper
        report, cryptographic_count = run_result
        dumps: list[bytes] = []
        pdfsig_version = SUPPORTED_PDF_SIG_VERSION
    else:
        report, cryptographic_count, dumps, pdfsig_version = run_result
    signatures = parse_pdfsig_output(report, len(data))
    if len(signatures) != cryptographic_count:
        raise PdfSignatureError("pdfsig record count differs from dumped signature count")
    if signatures:
        cms_results = _cms_cross_check(data, signatures, dumps, openssl_executable)
        for signature, cms_result in zip(signatures, cms_results):
            signature["cms_signature_integrity"] = cms_result
        if trust_anchors is not None:
            if len(signatures) == 1 and len(dumps) == 1:
                with tempfile.TemporaryDirectory(prefix="ssci-chain-") as directory_name:
                    chain = _verify_certificate_chain(
                        Path(directory_name), data, signatures[0], dumps[0],
                        trust_anchors, cms_results[0], openssl_executable,
                    )
            else:
                chain = {"result": "INCONCLUSIVE_MULTIPLE_SIGNATURE_ORDER_UNPROVEN"}
            for signature in signatures:
                signature["certificate_chain_verification"] = chain
    component_digests_after = {
        "pdfsig_executable_sha256": _executable_sha256(pdfsig_executable),
        "openssl_executable_sha256": _executable_sha256(openssl_executable),
    }
    if component_digests_after != component_digests_before:
        raise PdfSignatureError("verifier executable changed during inspection")
    return {
        "verifier_version": VERIFIER_VERSION,
        "pdfsig_version": pdfsig_version,
        "openssl_version": openssl_version,
        "verifier_components": component_digests_before,
        "document": {"path": str(path), "size": len(data), "sha256": hashlib.sha256(data).hexdigest()},
        "signature_count": len(signatures),
        "signatures": signatures,
        "trust": "UNKNOWN/NOT_EVALUATED",
        "certificate_chain": {
            "result": (
                "NOT_EVALUATED" if trust_anchors is None
                else "NO_SIGNATURES_TO_CHECK" if not signatures
                else "RESULTS_PER_SIGNATURE"
            ),
            "trust_anchor_bundle_sha256": (
                hashlib.sha256(trust_anchors).hexdigest()
                if trust_anchors is not None else None
            ),
        },
        "revocation": "UNKNOWN/NOT_EVALUATED",
        "pades": "UNKNOWN/NOT_EVALUATED",
        "professional_identity": "UNKNOWN/NOT_EVALUATED",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument(
        "--trust-anchor-bundle", type=Path,
        help="optional PEM trust anchors; results are diagnostic and not institutional approval",
    )
    args = parser.parse_args(argv)
    try:
        result = inspect_pdf(args.pdf, trust_anchor_bundle=args.trust_anchor_bundle)
    except (OSError, PdfSignatureError, FileNotFoundError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
