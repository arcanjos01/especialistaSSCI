"""Preparatory local receipt codecs and issuer for PDF verifier results.

This module does not verify PDF signatures, prove that a verifier executable
produced a supplied result through its generic issuer, select trust anchors,
establish professional identity, or admit a receipt to the Engine. The HMAC
codec and generic RSA issuer can authenticate caller-supplied results. The
local wrapper invokes the project verifier and binds its source and PDF bytes,
but key custody and a verifier-to-pipeline channel remain unimplemented.
Every output is preparatory and is not trusted Engine evidence.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import shutil
import subprocess
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Mapping


RECEIPT_SCHEMA_VERSION = "1.1.0"
RECEIPT_TYPE = "LOCAL_PDF_SIGNATURE_VERIFICATION_RECEIPT"
AUTHENTICATION_ALGORITHM = "HMAC_SHA256"
RSA_AUTHENTICATION_ALGORITHM = "RSA_SHA256_PKCS1_V1_5"
_DIGEST_RE = re.compile(r"^[0-9a-f]{64}$")
_KEY_RE = re.compile(r"^[A-Za-z0-9_-]{43}$")
_KEY_LAST_CHARS = "AEIMQUYcgkosw048"
_TIMESTAMP_RE = re.compile(
    r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,6})?Z$"
)
_JS_TRIM_CHARS = (
    "\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680"
    "\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007"
    "\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"
)
_FORBIDDEN_KEYS = {"__proto__", "prototype", "constructor"}
_CONTEXT_KEYS = {
    "presentationIdentity", "rdeIdentity", "rdeDigest", "sourceDocumentIdentity"
}
_INSPECTION_KEYS = {
    "verifier_version", "pdfsig_version", "openssl_version", "document",
    "signature_count", "signatures", "trust", "certificate_chain",
    "revocation", "pades", "professional_identity", "verifier_components",
}
_PAYLOAD_KEYS = {
    "receiptType", "schemaVersion", "receiptId", "presentationIdentity",
    "rdeIdentity", "rdeDigest", "sourceDocumentIdentity",
    "sourceDocumentDigest", "verifierId", "verifierVersion",
    "verifierSourceSha256", "createdAt", "verificationResult",
}


class SignatureReceiptError(ValueError):
    """Receipt input is malformed, unauthenticated, or bound to other evidence."""


def _is_plain_dict(value: Any) -> bool:
    return type(value) is dict and not (_FORBIDDEN_KEYS & value.keys())


def _utf16_length(value: str) -> int:
    try:
        return len(value.encode("utf-16-le")) // 2
    except UnicodeEncodeError as exc:
        raise SignatureReceiptError("receipt text contains invalid Unicode") from exc


def _require_exact_keys(value: Any, expected: set[str], label: str) -> dict[str, Any]:
    if not _is_plain_dict(value) or value.keys() != expected:
        raise SignatureReceiptError(f"{label} has an invalid shape")
    return value


def _require_text(value: Any, label: str, limit: int = 512) -> str:
    utf16_length = _utf16_length(value) if isinstance(value, str) else 0
    if (not isinstance(value, str) or not value or utf16_length > limit or
            value[0] in _JS_TRIM_CHARS or value[-1] in _JS_TRIM_CHARS or
            any(ord(char) < 0x20 for char in value)):
        raise SignatureReceiptError(f"{label} must be bounded non-empty text")
    return value


def _validate_timestamp(value: Any) -> str:
    timestamp = _require_text(value, "verification timestamp", 64)
    if not _TIMESTAMP_RE.fullmatch(timestamp):
        raise SignatureReceiptError("verification timestamp must be ISO-8601 UTC")
    try:
        parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError as exc:
        raise SignatureReceiptError("verification timestamp must be ISO-8601 UTC") from exc
    if parsed.utcoffset() is None or not timestamp.endswith("Z"):
        raise SignatureReceiptError("verification timestamp must be ISO-8601 UTC")
    return timestamp


def _require_digest(value: Any, label: str) -> str:
    if not isinstance(value, str) or not _DIGEST_RE.fullmatch(value):
        raise SignatureReceiptError(f"{label} must be a lowercase SHA-256 digest")
    return value


def _require_key(value: Any) -> str:
    if (not isinstance(value, str) or not _KEY_RE.fullmatch(value) or
            value[-1] not in _KEY_LAST_CHARS):
        raise SignatureReceiptError("receipt HMAC key must be canonical base64url key text")
    try:
        decoded = base64.urlsafe_b64decode(value + "=")
    except ValueError as exc:
        raise SignatureReceiptError("receipt HMAC key is malformed") from exc
    if len(decoded) != 32:
        raise SignatureReceiptError("receipt HMAC key must encode 256 bits")
    return value


def _canonical_json(value: Any) -> str:
    _validate_json_value(value)
    try:
        result = json.dumps(value, ensure_ascii=False, sort_keys=True,
                            separators=(",", ":"), allow_nan=False)
    except (TypeError, ValueError) as exc:
        raise SignatureReceiptError("receipt payload is not canonical JSON data") from exc
    if len(result.encode("utf-8")) > 2_000_000:
        raise SignatureReceiptError("receipt payload is too large")
    return result


def _validate_json_value(value: Any, depth: int = 0, nodes: list[int] | None = None) -> None:
    if nodes is None:
        nodes = [0]
    nodes[0] += 1
    if depth > 32 or nodes[0] > 50_000:
        raise SignatureReceiptError("receipt payload exceeds structural limits")
    if value is None or type(value) in (str, bool):
        if isinstance(value, str):
            try:
                if len(value.encode("utf-8")) > 1_000_000:
                    raise SignatureReceiptError("receipt contains oversized text")
            except UnicodeEncodeError as exc:
                raise SignatureReceiptError("receipt text contains invalid Unicode") from exc
        return
    if type(value) is int:
        if abs(value) > 9_007_199_254_740_991:
            raise SignatureReceiptError("receipt integer is not safely interoperable with JavaScript")
        return
    if type(value) is list:
        if len(value) > 10_000:
            raise SignatureReceiptError("receipt contains an oversized array")
        for item in value:
            _validate_json_value(item, depth + 1, nodes)
        return
    if _is_plain_dict(value):
        if len(value) > 256 or any(
            type(key) is not str or not key.isascii() for key in value
        ):
            raise SignatureReceiptError("receipt contains an invalid object")
        for item in value.values():
            _validate_json_value(item, depth + 1, nodes)
        return
    raise SignatureReceiptError("receipt contains an unsupported JSON value")


def _reject_duplicate_pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise SignatureReceiptError("receipt JSON contains a duplicate property")
        if key in _FORBIDDEN_KEYS:
            raise SignatureReceiptError("receipt JSON contains an unsafe property")
        result[key] = value
    return result


def parse_receipt_json(serialized: str) -> dict[str, Any]:
    if not isinstance(serialized, str) or len(serialized.encode("utf-8")) > 2_000_000:
        raise SignatureReceiptError("serialized receipt is invalid or too large")
    try:
        value = json.loads(serialized, object_pairs_hook=_reject_duplicate_pairs,
                           parse_constant=lambda _: (_ for _ in ()).throw(
                               SignatureReceiptError("receipt JSON contains a non-finite number")))
    except (json.JSONDecodeError, UnicodeError) as exc:
        raise SignatureReceiptError("serialized receipt is malformed") from exc
    if not _is_plain_dict(value):
        raise SignatureReceiptError("receipt envelope must be a plain JSON object")
    return value


def _validate_context(context: Any) -> dict[str, str]:
    data = _require_exact_keys(context, _CONTEXT_KEYS, "receipt context")
    return {
        "presentationIdentity": _require_text(data["presentationIdentity"], "presentation identity"),
        "rdeIdentity": _require_text(data["rdeIdentity"], "RDE identity"),
        "rdeDigest": _require_digest(data["rdeDigest"], "RDE digest"),
        "sourceDocumentIdentity": _require_text(data["sourceDocumentIdentity"], "source document identity"),
    }


def _validate_inspection(inspection: Any, pdf_bytes: bytes) -> tuple[dict[str, Any], str]:
    result = _require_exact_keys(inspection, _INSPECTION_KEYS, "local verifier result")
    if not isinstance(pdf_bytes, bytes) or not pdf_bytes:
        raise SignatureReceiptError("verified PDF bytes must be non-empty immutable bytes")
    document = _require_exact_keys(result["document"], {"path", "size", "sha256"}, "verifier document identity")
    if (type(document["size"]) is not int or document["size"] != len(pdf_bytes) or
            not isinstance(document["path"], str)):
        raise SignatureReceiptError("verifier document size or path is malformed")
    document_digest = _require_digest(document["sha256"], "verifier document digest")
    actual_digest = hashlib.sha256(pdf_bytes).hexdigest()
    if not hmac.compare_digest(document_digest, actual_digest):
        raise SignatureReceiptError("verifier result is for different PDF bytes")
    if type(result["signature_count"]) is not int or result["signature_count"] < 0:
        raise SignatureReceiptError("verifier signature count is malformed")
    if not isinstance(result["signatures"], list) or len(result["signatures"]) != result["signature_count"]:
        raise SignatureReceiptError("verifier signatures do not match the reported count")
    components = _require_exact_keys(
        result["verifier_components"],
        {"pdfsig_executable_sha256", "openssl_executable_sha256"},
        "verifier executable digests",
    )
    for key, value in components.items():
        _require_digest(value, f"{key} verifier component digest")
    sanitized = dict(result)
    sanitized["document"] = {"size": document["size"], "sha256": actual_digest}
    _validate_normalized_result(sanitized, actual_digest)
    return sanitized, actual_digest


def _validate_normalized_result(result: Any, document_digest: str) -> dict[str, Any]:
    data = _require_exact_keys(result, _INSPECTION_KEYS, "receipt verification result")
    document = _require_exact_keys(data["document"], {"size", "sha256"}, "receipt document result")
    if type(document["size"]) is not int or document["size"] < 1:
        raise SignatureReceiptError("receipt document size is malformed")
    if _require_digest(document["sha256"], "receipt document digest") != document_digest:
        raise SignatureReceiptError("receipt result does not match its document digest")
    if (type(data["signature_count"]) is not int or data["signature_count"] < 0 or
            not isinstance(data["signatures"], list) or
            len(data["signatures"]) != data["signature_count"]):
        raise SignatureReceiptError("receipt signature records are malformed")
    for key in ("verifier_version", "pdfsig_version", "openssl_version", "trust",
                "revocation", "pades", "professional_identity"):
        _require_text(data[key], f"receipt {key}", 128)
    components = _require_exact_keys(
        data["verifier_components"],
        {"pdfsig_executable_sha256", "openssl_executable_sha256"},
        "receipt verifier executable digests",
    )
    for key, value in components.items():
        _require_digest(value, f"receipt {key} verifier component digest")
    chain = _require_exact_keys(
        data["certificate_chain"], {"result", "trust_anchor_bundle_sha256"},
        "receipt certificate-chain result",
    )
    _require_text(chain["result"], "receipt certificate-chain status", 128)
    if chain["trust_anchor_bundle_sha256"] is not None:
        _require_digest(chain["trust_anchor_bundle_sha256"], "trust-anchor bundle digest")
    _canonical_json(data)
    return data


def issue_signature_verification_receipt(
    *,
    context: Mapping[str, Any],
    inspection: Mapping[str, Any],
    pdf_bytes: bytes,
    verifier_id: str,
    verifier_source_sha256: str,
    key_id: str,
    hmac_key: str,
    created_at: str,
    receipt_id: str | None = None,
) -> dict[str, Any]:
    """Create a signed envelope for the supplied result; no trust is asserted."""
    payload = _prepare_signature_receipt_payload(
        context=context,
        inspection=inspection,
        pdf_bytes=pdf_bytes,
        verifier_id=verifier_id,
        verifier_source_sha256=verifier_source_sha256,
        key_id=key_id,
        created_at=created_at,
        receipt_id=receipt_id,
    )
    key = _require_key(hmac_key)
    canonical = _canonical_json(payload).encode("utf-8")
    signature = base64.b64encode(hmac.new(key.encode("ascii"), canonical, hashlib.sha256).digest()).decode("ascii")
    return {
        "payload": payload,
        "authentication": {
            "keyId": _require_text(key_id, "receipt key id", 128),
            "algorithm": AUTHENTICATION_ALGORITHM,
            "signature": signature,
        },
    }


def issue_signature_verification_receipt_rsa(
    *,
    context: Mapping[str, Any],
    inspection: Mapping[str, Any],
    pdf_bytes: bytes,
    verifier_id: str,
    verifier_source_sha256: str,
    key_id: str,
    signing_private_key_path: str | Path,
    created_at: str,
    receipt_id: str | None = None,
) -> dict[str, Any]:
    """Sign a prepared receipt with a project-controlled RSA private key via OpenSSL."""
    payload = _prepare_signature_receipt_payload(
        context=context,
        inspection=inspection,
        pdf_bytes=pdf_bytes,
        verifier_id=verifier_id,
        verifier_source_sha256=verifier_source_sha256,
        key_id=key_id,
        created_at=created_at,
        receipt_id=receipt_id,
    )
    key_path = Path(signing_private_key_path)
    if not key_path.is_file():
        raise SignatureReceiptError("receipt signing key file is unavailable")
    try:
        environment = {"PATH": os.defpath, "LANG": "C", "LC_ALL": "C"}
        key_check = subprocess.run(
            ["openssl", "rsa", "-in", str(key_path), "-noout", "-modulus"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=15,
            env=environment,
        )
        modulus_match = re.fullmatch(rb"Modulus=([0-9A-Fa-f]+)\s*", key_check.stdout)
        if (key_check.returncode != 0 or not modulus_match or
                len(modulus_match.group(1)) not in (512, 768, 1024) or
                modulus_match.group(1)[:1] not in b"89abcdefABCDEF"):
            raise SignatureReceiptError("receipt signing key must be a 2048/3072/4096-bit RSA key")
        completed = subprocess.run(
            ["openssl", "dgst", "-sha256", "-sign", str(key_path)],
            input=_canonical_json(payload).encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=15,
            env=environment,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise SignatureReceiptError("local RSA receipt signing failed") from exc
    if completed.returncode != 0 or not completed.stdout:
        raise SignatureReceiptError("local RSA receipt signing failed")
    return {
        "payload": payload,
        "authentication": {
            "keyId": _require_text(key_id, "receipt key id", 128),
            "algorithm": RSA_AUTHENTICATION_ALGORITHM,
            "signature": base64.b64encode(completed.stdout).decode("ascii"),
        },
    }


def issue_local_pdf_signature_verification_receipt(
    *,
    pdf_path: str | Path,
    context: Mapping[str, Any],
    key_id: str,
    signing_private_key_path: str | Path,
    created_at: str,
    receipt_id: str | None = None,
    trust_anchor_bundle: str | Path | None = None,
) -> dict[str, Any]:
    """Inspect the exact local PDF, then sign that verifier's result with RSA.

    This controlled local interface removes caller-supplied inspection output.
    It remains preparatory: key custody, pipeline identity binding, and Engine
    admission are separate contracts.
    """
    from tools import verify_pdf_signatures_local

    source_path = Path(pdf_path)
    verifier_path = Path(verify_pdf_signatures_local.__file__).resolve()
    try:
        verifier_source_before = verifier_path.read_bytes()
        inspection = verify_pdf_signatures_local.inspect_pdf(
            source_path,
            trust_anchor_bundle=Path(trust_anchor_bundle) if trust_anchor_bundle else None,
        )
        pdf_bytes = source_path.read_bytes()
        verifier_source_after = verifier_path.read_bytes()
    except OSError as exc:
        raise SignatureReceiptError("local PDF or verifier source is unavailable") from exc
    if verifier_source_before != verifier_source_after:
        raise SignatureReceiptError("local verifier source changed during inspection")
    actual_pdf_digest = hashlib.sha256(pdf_bytes).hexdigest()
    document_record = inspection.get("document") if isinstance(inspection, dict) else None
    if (not isinstance(document_record, dict) or
            document_record.get("sha256") != actual_pdf_digest):
        raise SignatureReceiptError("local PDF changed during signature inspection")
    verifier_digest = hashlib.sha256(verifier_source_before).hexdigest()
    if not shutil.which("pdfsig") or not shutil.which("openssl"):
        raise SignatureReceiptError("local PDF verifier dependencies are unavailable")
    return issue_signature_verification_receipt_rsa(
        context=context,
        inspection=inspection,
        pdf_bytes=pdf_bytes,
        verifier_id="PROJECT_LOCAL_PDF_SIGNATURE_VERIFIER",
        verifier_source_sha256=verifier_digest,
        key_id=key_id,
        signing_private_key_path=signing_private_key_path,
        created_at=created_at,
        receipt_id=receipt_id,
    )


def _prepare_signature_receipt_payload(
    *,
    context: Mapping[str, Any],
    inspection: Mapping[str, Any],
    pdf_bytes: bytes,
    verifier_id: str,
    verifier_source_sha256: str,
    key_id: str,
    created_at: str,
    receipt_id: str | None,
) -> dict[str, Any]:
    bound = _validate_context(dict(context))
    normalized_result, document_digest = _validate_inspection(inspection, pdf_bytes)
    verifier_name = _require_text(verifier_id, "verifier id", 128)
    source_digest = _require_digest(verifier_source_sha256, "verifier source digest")
    identifier = _require_text(receipt_id or str(uuid.uuid4()), "receipt id", 128)
    _require_text(key_id, "verifier key id", 128)
    timestamp = _validate_timestamp(created_at)

    return {
        "receiptType": RECEIPT_TYPE,
        "schemaVersion": RECEIPT_SCHEMA_VERSION,
        "receiptId": identifier,
        **bound,
        "sourceDocumentDigest": document_digest,
        "verifierId": verifier_name,
        "verifierVersion": _require_text(normalized_result["verifier_version"], "verifier version", 128),
        "verifierSourceSha256": source_digest,
        "createdAt": timestamp,
        "verificationResult": normalized_result,
    }


def verify_signature_verification_receipt(
    receipt: Any,
    *,
    expected_context: Mapping[str, Any],
    expected_document_digest: str,
    trusted_keys: Mapping[str, str],
) -> bool:
    """Verify authenticity and exact identity binding; never decides admission."""
    try:
        envelope = _require_exact_keys(receipt, {"payload", "authentication"}, "receipt envelope")
        payload = _require_exact_keys(envelope["payload"], _PAYLOAD_KEYS, "receipt payload")
        authentication = _require_exact_keys(
            envelope["authentication"], {"keyId", "algorithm", "signature"}, "receipt authentication"
        )
        context = _validate_context(dict(expected_context))
        digest = _require_digest(expected_document_digest, "expected document digest")
        if payload["receiptType"] != RECEIPT_TYPE or payload["schemaVersion"] != RECEIPT_SCHEMA_VERSION:
            return False
        _require_text(payload["receiptId"], "receipt id", 128)
        _validate_context({key: payload[key] for key in _CONTEXT_KEYS})
        _require_digest(payload["rdeDigest"], "receipt RDE digest")
        _require_digest(payload["verifierSourceSha256"], "receipt verifier source digest")
        _require_text(payload["verifierId"], "receipt verifier id", 128)
        _require_text(payload["verifierVersion"], "receipt verifier version", 128)
        _require_text(payload["createdAt"], "receipt timestamp", 64)
        verification_result = _require_exact_keys(
            payload["verificationResult"], _INSPECTION_KEYS, "receipt verification result"
        )
        result_document = _require_exact_keys(
            verification_result["document"], {"size", "sha256"}, "receipt document result"
        )
        _validate_normalized_result(verification_result, digest)
        _validate_timestamp(payload["createdAt"])
        if (result_document["sha256"] != digest or type(result_document["size"]) is not int or
                result_document["size"] < 1 or
                verification_result["verifier_version"] != payload["verifierVersion"]):
            return False
        _canonical_json(payload)
        key_id = _require_text(authentication["keyId"], "receipt key id", 128)
        if authentication["algorithm"] != AUTHENTICATION_ALGORITHM:
            return False
        candidate_key = trusted_keys.get(key_id) if isinstance(trusted_keys, Mapping) else None
        if candidate_key is None:
            return False
        key = _require_key(candidate_key)
        if payload["receiptType"] != RECEIPT_TYPE or payload["schemaVersion"] != RECEIPT_SCHEMA_VERSION:
            return False
        if any(payload[name] != value for name, value in context.items()):
            return False
        if payload["sourceDocumentDigest"] != digest:
            return False
        verification_result = payload["verificationResult"]
        if not _is_plain_dict(verification_result):
            return False
        document = verification_result.get("document")
        if not _is_plain_dict(document) or document.get("sha256") != digest:
            return False
        expected_signature = base64.b64encode(
            hmac.new(key.encode("ascii"), _canonical_json(payload).encode("utf-8"), hashlib.sha256).digest()
        ).decode("ascii")
        supplied_signature = authentication["signature"]
        return (isinstance(supplied_signature, str) and len(supplied_signature) == 44 and
                hmac.compare_digest(expected_signature, supplied_signature))
    except (SignatureReceiptError, TypeError, ValueError, AttributeError):
        return False
