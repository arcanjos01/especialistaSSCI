from __future__ import annotations

import base64
import copy
import hashlib
import unittest

from tools.signature_verification_receipt import (
    SignatureReceiptError,
    issue_signature_verification_receipt,
    parse_receipt_json,
    verify_signature_verification_receipt,
)


KEY = base64.urlsafe_b64encode(bytes(range(32))).decode("ascii").rstrip("=")
KEY_ID = "LOCAL_VERIFIER_KEY_V1"
PDF = b"%PDF-1.7\nTEST_ONLY"
PDF_DIGEST = hashlib.sha256(PDF).hexdigest()
CONTEXT = {
    "presentationIdentity": "protocol:TEST_PROTOCOL|re:TEST_RE|date:2026-10-20",
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
