from __future__ import annotations

import base64
import copy
import hashlib
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from tools.signature_verification_receipt import (
    SignatureReceiptError,
    issue_signature_verification_receipt,
    issue_signature_verification_receipt_rsa,
    issue_local_pdf_signature_verification_receipt,
    parse_receipt_json,
    verify_signature_verification_receipt,
)


KEY = base64.urlsafe_b64encode(bytes(range(32))).decode("ascii").rstrip("=")
KEY_ID = "LOCAL_VERIFIER_KEY_V1"
PDF = b"%PDF-1.7\nTEST_ONLY"
PDF_DIGEST = hashlib.sha256(PDF).hexdigest()
CONTEXT = {
    "presentationIdentity": "CBMSC_HABITESE_PRESENTATION_V1:[\"TEST_PROTOCOL\",\"2026-10-20\"]",
    "rdeIdentity": "rde:TEST_RDE",
    "rdeDigest": "a" * 64,
    "sourceDocumentIdentity": "drive-file:TEST_PDF",
}


def inspection(pdf_bytes: bytes = PDF) -> dict:
    return {
        "verifier_version": "local-pdf-signature-verifier/1.3",
        "pdfsig_version": "24.02.0",
        "openssl_version": "OpenSSL TEST_ONLY",
        "document": {
            "path": "/private/local/path.pdf",
            "size": len(pdf_bytes),
            "sha256": hashlib.sha256(pdf_bytes).hexdigest(),
        },
        "signature_count": 1,
        "signatures": [{
            "field": "Sig1",
            "integrity": {"result": "VALID"},
            "coverage": {"full_document_current_revision": True},
        }],
        "trust": "UNKNOWN/NOT_EVALUATED",
        "certificate_chain": {"result": "NOT_EVALUATED", "trust_anchor_bundle_sha256": None},
        "revocation": "UNKNOWN/NOT_EVALUATED",
        "pades": "UNKNOWN/NOT_EVALUATED",
        "professional_identity": "UNKNOWN/NOT_EVALUATED",
    }


def issue(pdf_bytes: bytes = PDF) -> dict:
    return issue_signature_verification_receipt(
        context=CONTEXT,
        inspection=inspection(pdf_bytes),
        pdf_bytes=pdf_bytes,
        verifier_id="local-pdfsig-openssl",
        verifier_executable_sha256="b" * 64,
        key_id=KEY_ID,
        hmac_key=KEY,
        created_at="2026-10-20T12:00:00Z",
        receipt_id="RECEIPT_TEST_001",
    )


class SignatureVerificationReceiptTests(unittest.TestCase):
    @unittest.skipUnless(shutil.which("openssl"), "OpenSSL CLI unavailable")
    def test_rsa_issuer_signs_canonical_receipt_for_pinned_public_key(self):
        with tempfile.TemporaryDirectory() as directory:
            private_key = Path(directory) / "test-only-private.pem"
            public_key = Path(directory) / "test-only-public.pem"
            signature_path = Path(directory) / "receipt.sig"
            subprocess.run(
                ["openssl", "genpkey", "-algorithm", "RSA", "-pkeyopt",
                 "rsa_keygen_bits:2048", "-out", str(private_key)],
                check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            )
            subprocess.run(
                ["openssl", "pkey", "-in", str(private_key), "-pubout", "-out", str(public_key)],
                check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            )
            receipt = issue_signature_verification_receipt_rsa(
                context=CONTEXT, inspection=inspection(), pdf_bytes=PDF,
                verifier_id="project-controlled-local-verifier",
                verifier_executable_sha256="b" * 64,
                key_id=KEY_ID, signing_private_key_path=private_key,
                created_at="2026-10-20T12:00:00.123456Z", receipt_id="😀" * 64,
            )
            self.assertEqual(receipt["authentication"]["algorithm"], "RSA_SHA256_PKCS1_V1_5")
            signature_path.write_bytes(base64.b64decode(receipt["authentication"]["signature"]))
            canonical = json.dumps(
                receipt["payload"], ensure_ascii=False, sort_keys=True,
                separators=(",", ":"), allow_nan=False,
            ).encode("utf-8")
            verified = subprocess.run(
                ["openssl", "dgst", "-sha256", "-verify", str(public_key),
                 "-signature", str(signature_path)],
                input=canonical, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                check=False, timeout=15,
            )
            self.assertEqual(verified.returncode, 0, verified.stderr.decode("utf-8", "replace"))
            self.assertIn(b"Verified OK", verified.stdout)

    @unittest.skipUnless(shutil.which("openssl"), "OpenSSL CLI unavailable")
    def test_local_issuer_calls_verifier_and_binds_pdf_and_verifier_source(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            private_key = root / "test-only-private.pem"
            pdf_path = root / "local.pdf"
            pdf_path.write_bytes(PDF)
            subprocess.run(
                ["openssl", "genpkey", "-algorithm", "RSA", "-pkeyopt",
                 "rsa_keygen_bits:2048", "-out", str(private_key)],
                check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            )
            with patch("tools.verify_pdf_signatures_local.inspect_pdf",
                       return_value=inspection(PDF)) as inspect:
                receipt = issue_local_pdf_signature_verification_receipt(
                    pdf_path=pdf_path, context=CONTEXT, key_id=KEY_ID,
                    signing_private_key_path=private_key,
                    created_at="2026-10-20T12:00:00Z",
                )
            inspect.assert_called_once()
            self.assertEqual(receipt["payload"]["sourceDocumentDigest"], PDF_DIGEST)
            verifier_source = Path("tools/verify_pdf_signatures_local.py").read_bytes()
            self.assertEqual(
                receipt["payload"]["verifierExecutableSha256"],
                hashlib.sha256(verifier_source).hexdigest(),
            )
            self.assertEqual(
                receipt["payload"]["verificationResult"]["trust"],
                "UNKNOWN/NOT_EVALUATED",
            )
            self.assertEqual(
                receipt["payload"]["verificationResult"]["revocation"],
                "UNKNOWN/NOT_EVALUATED",
            )

    def test_authenticated_receipt_binds_all_exact_identities_and_preserves_unknowns(self):
        receipt = issue()
        self.assertNotIn("path", receipt["payload"]["verificationResult"]["document"])
        self.assertEqual(receipt["payload"]["verificationResult"]["trust"], "UNKNOWN/NOT_EVALUATED")
        self.assertEqual(receipt["payload"]["verificationResult"]["revocation"], "UNKNOWN/NOT_EVALUATED")
        self.assertTrue(verify_signature_verification_receipt(
            receipt, expected_context=CONTEXT, expected_document_digest=PDF_DIGEST,
            trusted_keys={KEY_ID: KEY}
        ))

    def test_presentation_rde_source_identity_and_digests_cannot_be_replayed(self):
        receipt = issue()
        for key, value in (
            ("presentationIdentity", "other presentation"),
            ("rdeIdentity", "other RDE"),
            ("rdeDigest", "c" * 64),
            ("sourceDocumentIdentity", "other document"),
        ):
            context = dict(CONTEXT)
            context[key] = value
            with self.subTest(key=key):
                self.assertFalse(verify_signature_verification_receipt(
                    receipt, expected_context=context, expected_document_digest=PDF_DIGEST,
                    trusted_keys={KEY_ID: KEY}
                ))
        self.assertFalse(verify_signature_verification_receipt(
            receipt, expected_context=CONTEXT, expected_document_digest="c" * 64,
            trusted_keys={KEY_ID: KEY}
        ))

    def test_modified_result_unknown_key_or_algorithm_fails_closed(self):
        receipt = issue()
        modified = copy.deepcopy(receipt)
        modified["payload"]["verificationResult"]["professional_identity"] = "VERIFIED"
        self.assertFalse(verify_signature_verification_receipt(
            modified, expected_context=CONTEXT, expected_document_digest=PDF_DIGEST,
            trusted_keys={KEY_ID: KEY}
        ))
        self.assertFalse(verify_signature_verification_receipt(
            receipt, expected_context=CONTEXT, expected_document_digest=PDF_DIGEST,
            trusted_keys={"UNKNOWN_KEY": KEY}
        ))
        modified = copy.deepcopy(receipt)
        modified["authentication"]["algorithm"] = "UNSUPPORTED"
        self.assertFalse(verify_signature_verification_receipt(
            modified, expected_context=CONTEXT, expected_document_digest=PDF_DIGEST,
            trusted_keys={KEY_ID: KEY}
        ))

    def test_issue_refuses_verifier_result_for_different_bytes_or_identity(self):
        with self.assertRaises(SignatureReceiptError):
            issue_signature_verification_receipt(
                context=CONTEXT, inspection=inspection(b"other bytes"), pdf_bytes=PDF,
                verifier_id="local-pdfsig-openssl", verifier_executable_sha256="b" * 64,
                key_id=KEY_ID, hmac_key=KEY, created_at="2026-10-20T12:00:00Z"
            )

    def test_issue_rejects_unsafe_nested_payload_properties(self):
        unsafe = inspection()
        unsafe["signatures"][0]["__proto__"] = {"forged": True}
        with self.assertRaises(SignatureReceiptError):
            issue_signature_verification_receipt(
                context=CONTEXT, inspection=unsafe, pdf_bytes=PDF,
                verifier_id="local-pdfsig-openssl", verifier_executable_sha256="b" * 64,
                key_id=KEY_ID, hmac_key=KEY, created_at="2026-10-20T12:00:00Z"
            )
        bad_inspection = inspection()
        bad_inspection["signature_count"] = 2
        with self.assertRaises(SignatureReceiptError):
            issue_signature_verification_receipt(
                context=CONTEXT, inspection=bad_inspection, pdf_bytes=PDF,
                verifier_id="local-pdfsig-openssl", verifier_executable_sha256="b" * 64,
                key_id=KEY_ID, hmac_key=KEY, created_at="2026-10-20T12:00:00Z"
            )

    def test_issue_rejects_json_values_without_python_javascript_canonical_parity(self):
        for field, value in (("unsafeInteger", 9_007_199_254_740_992), ("á", "value")):
            unsafe = inspection()
            unsafe["signatures"][0][field] = value
            with self.subTest(field=field), self.assertRaises(SignatureReceiptError):
                issue_signature_verification_receipt(
                    context=CONTEXT, inspection=unsafe, pdf_bytes=PDF,
                    verifier_id="local-pdfsig-openssl", verifier_executable_sha256="b" * 64,
                    key_id=KEY_ID, hmac_key=KEY, created_at="2026-10-20T12:00:00Z"
                )

    def test_issue_uses_javascript_utf16_text_limits_and_strict_utc_timestamp(self):
        with self.assertRaises(SignatureReceiptError):
            issue_signature_verification_receipt(
                context=CONTEXT, inspection=inspection(), pdf_bytes=PDF,
                verifier_id="local-pdfsig-openssl", verifier_executable_sha256="b" * 64,
                key_id=KEY_ID, hmac_key=KEY, created_at="2026-10-20T12:00:00Z",
                receipt_id="😀" * 80,
            )
        with self.assertRaises(SignatureReceiptError):
            issue_signature_verification_receipt(
                context=CONTEXT, inspection=inspection(), pdf_bytes=PDF,
                verifier_id="local-pdfsig-openssl", verifier_executable_sha256="b" * 64,
                key_id=KEY_ID, hmac_key=KEY, created_at="2026-10-20 12:00:00Z",
            )
        with self.assertRaises(SignatureReceiptError):
            issue_signature_verification_receipt(
                context=CONTEXT, inspection=inspection(), pdf_bytes=PDF,
                verifier_id="local-pdfsig-openssl", verifier_executable_sha256="b" * 64,
                key_id=KEY_ID, hmac_key=KEY, created_at="2026-10-20T12:00:00Z",
                receipt_id="\ufeffRECEIPT_TEST_001",
            )

    def test_strict_json_rejects_duplicates_unsafe_keys_and_non_finite_values(self):
        for serialized in (
            '{"payload":{},"payload":{},"authentication":{}}',
            '{"payload":{"__proto__":{}},"authentication":{}}',
            '{"payload":{"value":NaN},"authentication":{}}',
        ):
            with self.subTest(serialized=serialized), self.assertRaises(SignatureReceiptError):
                parse_receipt_json(serialized)

    def test_receipt_rejects_unknown_envelope_or_payload_fields(self):
        receipt = issue()
        receipt["extra"] = "not signed"
        self.assertFalse(verify_signature_verification_receipt(
            receipt, expected_context=CONTEXT, expected_document_digest=PDF_DIGEST,
            trusted_keys={KEY_ID: KEY}
        ))
        receipt = issue()
        receipt["payload"]["policyDecision"] = "ADMITTED"
        self.assertFalse(verify_signature_verification_receipt(
            receipt, expected_context=CONTEXT, expected_document_digest=PDF_DIGEST,
            trusted_keys={KEY_ID: KEY}
        ))


if __name__ == "__main__":
    unittest.main()
