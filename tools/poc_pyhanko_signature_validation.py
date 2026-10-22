#!/usr/bin/env python3
"""Local-only PDF signature validation spike using explicit trust material.

This prototype is not an Engine verifier, authenticated receipt issuer, or
institutional trust decision. It never enables certificate/revocation fetching
and always reports admission as NOT_DECIDED.

Optional dependency for the isolated spike: pyHanko 0.38.0.
"""

from __future__ import annotations

import hashlib
from importlib.metadata import PackageNotFoundError, version
from io import BytesIO
from typing import Any, Sequence


SUPPORTED_PYHANKO_VERSION = "0.38.0"
MAX_PDF_BYTES = 50 * 1024 * 1024
MAX_SIGNATURES = 20


class PdfValidationSpikeError(ValueError):
    """Input or validation profile cannot be safely evaluated by this spike."""


def _require_supported_pyhanko() -> str:
    try:
        found = version("pyHanko")
    except PackageNotFoundError as exc:
        raise PdfValidationSpikeError("optional pyHanko dependency is unavailable") from exc
    if found != SUPPORTED_PYHANKO_VERSION:
        raise PdfValidationSpikeError("unsupported pyHanko version")
    return found


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def validate_pdf_bytes(
    pdf_bytes: bytes,
    *,
    profile_id: str,
    profile_version: str,
    trust_roots: Sequence[Any],
    crls_der: Sequence[bytes],
) -> dict[str, Any]:
    """Inspect each PDF signature under a frozen, caller-supplied CRL policy.

    `trust_roots` contains pyhanko-certvalidator certificate objects. CRLs are
    DER bytes. Empty trust/revocation inputs stay empty; the function never
    falls back to operating-system roots or fetches missing material.
    """
    if not isinstance(pdf_bytes, bytes) or not pdf_bytes:
        raise PdfValidationSpikeError("PDF bytes must be a non-empty immutable byte string")
    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise PdfValidationSpikeError("PDF exceeds the local spike size limit")
    if not isinstance(profile_id, str) or not profile_id.strip():
        raise PdfValidationSpikeError("profile_id is required")
    if not isinstance(profile_version, str) or not profile_version.strip():
        raise PdfValidationSpikeError("profile_version is required")

    pyhanko_version = _require_supported_pyhanko()
    if not isinstance(trust_roots, (tuple, list)) or not isinstance(crls_der, (tuple, list)):
        raise PdfValidationSpikeError("trust roots and CRLs must be frozen lists or tuples")
    roots = tuple(trust_roots)
    crls = tuple(crls_der)
    from asn1crypto import x509 as asn1_x509

    if any(not isinstance(cert, asn1_x509.Certificate) for cert in roots):
        raise PdfValidationSpikeError("trust roots must be parsed X.509 certificates")
    if any(not isinstance(crl, bytes) or not crl for crl in crls):
        raise PdfValidationSpikeError("each CRL must be non-empty DER bytes")

    from pyhanko.pdf_utils.reader import PdfFileReader
    from pyhanko.sign.validation import validate_pdf_signature
    from pyhanko_certvalidator import ValidationContext
    from pyhanko_certvalidator.policy_decl import (
        CertRevTrustPolicy,
        RevocationCheckingPolicy,
        RevocationCheckingRule,
    )

    revocation_policy = CertRevTrustPolicy(
        RevocationCheckingPolicy(
            RevocationCheckingRule.CRL_REQUIRED,
            RevocationCheckingRule.CRL_REQUIRED,
        )
    )
    root_digests = sorted(_sha256(cert.dump()) for cert in roots)
    crl_digests = sorted(_sha256(crl) for crl in crls)
    document_digest = _sha256(pdf_bytes)

    try:
        reader = PdfFileReader(BytesIO(pdf_bytes))
        signatures = tuple(reader.embedded_signatures)
    except Exception as exc:
        raise PdfValidationSpikeError("PDF signature structure could not be parsed") from exc
    if len(signatures) > MAX_SIGNATURES:
        raise PdfValidationSpikeError("PDF exceeds the local spike signature-count limit")

    results: list[dict[str, Any]] = []
    for ordinal, embedded_signature in enumerate(signatures, start=1):
        context = ValidationContext(
            trust_roots=roots,
            other_certs=roots,
            allow_fetching=False,
            crls=crls,
            ocsps=(),
            revinfo_policy=revocation_policy,
        )
        try:
            status = validate_pdf_signature(
                embedded_signature,
                signer_validation_context=context,
                ts_validation_context=context,
            )
        except Exception as exc:
            results.append({
                "ordinal": ordinal,
                "content_integrity": "UNKNOWN/NOT_EVALUATED",
                "cryptographic_signature_validity": "UNKNOWN/NOT_EVALUATED",
                "integrity": "UNKNOWN/NOT_EVALUATED",
                "certificate_trust": "UNKNOWN/NOT_EVALUATED",
                "revocation": "UNKNOWN/NOT_EVALUATED",
                "coverage": "UNKNOWN/NOT_EVALUATED",
                "validation_error_class": type(exc).__name__,
                "bottom_line": False,
                "admission": "NOT_DECIDED",
            })
            continue

        coverage = getattr(status.coverage, "name", "UNKNOWN/NOT_EVALUATED")
        intact = status.intact
        valid = getattr(status, "valid", None)
        content_integrity = (
            "VALID" if intact is True else
            "INVALID" if intact is False else
            "UNKNOWN/NOT_EVALUATED"
        )
        cryptographic_signature_validity = (
            "VALID" if valid is True else
            "INVALID" if valid is False else
            "UNKNOWN/NOT_EVALUATED"
        )
        trust_problem = getattr(status.trust_problem_indic, "name", None)
        revoked = status.revoked
        results.append({
            "ordinal": ordinal,
            "content_integrity": content_integrity,
            "cryptographic_signature_validity": cryptographic_signature_validity,
            "integrity": "VALID" if intact is True and valid is True else "INVALID" if intact is False or valid is False else "UNKNOWN/NOT_EVALUATED",
            "certificate_trust": "TRUSTED" if status.trusted is True else "NOT_TRUSTED" if status.trusted is False else "UNKNOWN/NOT_EVALUATED",
            "trust_problem": trust_problem,
            "revocation": "REVOKED" if revoked is True else "NOT_REVOKED_IN_VALIDATED_CONTEXT" if status.trusted is True else "UNKNOWN/NOT_EVALUATED",
            "coverage": coverage,
            "current_file_fully_covered": coverage == "ENTIRE_FILE",
            "bottom_line": bool(status.bottom_line),
            "admission": "NOT_DECIDED",
        })

    return {
        "artifact_type": "LOCAL_PDF_SIGNATURE_VALIDATION_SPIKE",
        "document_sha256": document_digest,
        "profile_id": profile_id,
        "profile_version": profile_version,
        "verifier": "pyHanko",
        "verifier_version": pyhanko_version,
        "network_fetching": "DISABLED",
        "revocation_policy": "CRL_REQUIRED_FOR_END_ENTITY_AND_NON_TRUST_ANCHOR_CA",
        "trust_root_sha256": root_digests,
        "crl_sha256": crl_digests,
        "signature_count": len(results),
        "signatures": results,
        "admission": "NOT_DECIDED",
    }
