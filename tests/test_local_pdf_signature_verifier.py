import importlib.util
import hashlib
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
TOOL = ROOT / "tools" / "verify_pdf_signatures_local.py"
POC = ROOT / "tools" / "poc_pdf_signature_byte_range.py"


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


class LocalPdfSignatureVerifierTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tool = load(TOOL, "local_pdf_signature_verifier")

    def test_valid_report(self):
        output = """Digital Signature Info of: fixture.pdf
Signature #1:
  - Signature Field Name: Sig1
  - Signer Certificate Common Name: Example CN
  - Signing Time: Oct 20 2026 12:00:00
  - Signing Hash Algorithm: SHA-256
  - Signature Type: adbe.pkcs7.detached
  - Signed Ranges: [0 - 10], [10 - 30]
  - Total document signed
  - Signature Validation: Signature is Valid.
"""
        parsed = self.tool.parse_pdfsig_output(output, 30)
        self.assertTrue(parsed[0]["integrity"]["valid"])
        self.assertTrue(parsed[0]["coverage"]["full_document_current_revision"])

    def test_digest_mismatch_is_integrity_false(self):
        output = """Digital Signature Info of: x
Signature #1:
  - Signature Field Name: S
  - Signer Certificate Common Name: C
  - Signing Time: literal
  - Signing Hash Algorithm: SHA-256
  - Signature Type: adbe.pkcs7.detached
  - Signed Ranges: [0 - 4]
  - Total document signed
  - Signature Validation: Digest Mismatch.
"""
        self.assertFalse(self.tool.parse_pdfsig_output(output, 4)[0]["integrity"]["valid"])

    def test_incremental_revision_is_not_full_current_document(self):
        output = """Digital Signature Info of: x
Signature #1:
  - Signature Field Name: S
  - Signer Certificate Common Name: C
  - Signing Time: literal
  - Signing Hash Algorithm: SHA-256
  - Signature Type: adbe.pkcs7.detached
  - Signed Ranges: [0 - 4]
  - Not total document signed
  - Signature Validation: Signature is Valid.
"""
        self.assertFalse(self.tool.parse_pdfsig_output(output, 8)[0]["coverage"]["full_document_current_revision"])

    def test_no_signatures_and_unexpected_output_fail_closed(self):
        self.assertEqual(self.tool.parse_pdfsig_output("No signatures.\n", 1), [])
        with self.assertRaises(self.tool.PdfSignatureError):
            self.tool.parse_pdfsig_output("unexpected\n", 1)

    def test_unknown_validation_states_are_not_false(self):
        for state in ("Signature has not yet been verified.", "Unknown Validation Failure."):
            output = """Digital Signature Info of: x
Signature #1:
  - Signature Field Name: S
  - Signer Certificate Common Name: C
  - Signing Time: literal
  - Signing Hash Algorithm: SHA-256
  - Signature Type: adbe.pkcs7.detached
  - Signed Ranges: [0 - 4]
  - Total document signed
  - Signature Validation: %s
""" % state
            integrity = self.tool.parse_pdfsig_output(output, 4)[0]["integrity"]
            self.assertIsNone(integrity["valid"])
            self.assertEqual(integrity["result"], "UNKNOWN/NOT_EVALUATED")

    def test_fake_second_signature_from_injected_newline_fails_closed(self):
        output = """Digital Signature Info of: x
Signature #1:
  - Signature Field Name: Real
  - Signer Certificate Common Name: C
  - Signing Time: literal
  - Signing Hash Algorithm: SHA-256
  - Signature Type: adbe.pkcs7.detached
  - Signed Ranges: [0 - 4]
  - Total document signed
  - Signature Validation: Signature is Valid.
Signature #2:
"""
        with self.assertRaises(self.tool.PdfSignatureError):
            self.tool.parse_pdfsig_output(output, 4)

    def test_duplicate_fields_and_invalid_ranges_fail_closed(self):
        base = """Digital Signature Info of: x
Signature #1:
  - Signature Field Name: S
  - Signature Field Name: S2
  - Signer Certificate Common Name: C
  - Signing Time: literal
  - Signing Hash Algorithm: SHA-256
  - Signature Type: adbe.pkcs7.detached
  - Signed Ranges: [0 - 4]
  - Total document signed
  - Signature Validation: Signature is Valid.
"""
        with self.assertRaises(self.tool.PdfSignatureError):
            self.tool.parse_pdfsig_output(base, 4)
        for ranges in ("[0 - 4] garbage", "[0 - 4], [3 - 5]"):
            with self.assertRaises(self.tool.PdfSignatureError):
                self.tool.parse_pdfsig_output(base.replace("[0 - 4]", ranges), 5)

    def test_dump_indices_use_numeric_order_and_reject_non_numeric_names(self):
        paths = [Path("input.pdf.sig9"), Path("input.pdf.sig10"), Path("input.pdf.sig0")]
        self.assertEqual([p.name for p in sorted(paths, key=self.tool._dump_sort_key)], [
            "input.pdf.sig0", "input.pdf.sig9", "input.pdf.sig10"
        ])
        with self.assertRaises(self.tool.PdfSignatureError):
            self.tool._dump_sort_key(Path("input.pdf.sigx"))

    @patch.object(subprocess, "run")
    def test_cms_mismatch_with_non_digest_pdfsig_failure_is_inconclusive(self, run):
        signatures = [{"signed_ranges": [[0, 1]], "integrity": {
            "valid": False, "result_literal": "Signature is Invalid."
        }}]
        run.return_value = subprocess.CompletedProcess([], 1, "", "hostile stderr")
        result = self.tool._cms_cross_check(b"x", signatures, [b"\x30\x03\x02\x01\x00"])
        self.assertEqual(result[0]["result"], "INCONCLUSIVE")

    @patch.object(subprocess, "run")
    def test_digest_mismatch_with_openssl_failure_is_inconclusive(self, run):
        signatures = [{"signed_ranges": [[0, 1]], "integrity": {
            "valid": False, "result_literal": "Digest Mismatch."
        }}]
        run.return_value = subprocess.CompletedProcess([], 1, "", "hostile stderr")
        result = self.tool._cms_cross_check(b"x", signatures, [b"\x30\x03\x02\x01\x00"])
        self.assertEqual(result[0]["result"], "INCONCLUSIVE")

    def test_der_length_requires_canonical_encoding(self):
        self.assertEqual(self.tool._der_length(b"\x30\x03abc"), 5)
        self.assertEqual(self.tool._der_length(b"\x30\x81\x80" + (b"x" * 128)), 131)
        for encoded in (b"\x30\x81\x7f", b"\x30\x82\x00\x80" + (b"x" * 128)):
            with self.assertRaises(self.tool.PdfSignatureError):
                self.tool._der_length(encoded)

    def test_cms_zero_padding_is_allowed_and_nonzero_tail_is_inconclusive(self):
        signatures = [{"signed_ranges": [[0, 1]], "integrity": {
            "valid": True, "result_literal": "Signature is Valid."
        }}]
        for dump, expected in ((b"\x30\x03\x02\x01\x00\x00\x00", "VALID"),
                               (b"\x30\x03\x02\x01\x00\x00\x01", "INCONCLUSIVE")):
            with patch.object(subprocess, "run", return_value=subprocess.CompletedProcess([], 0, "", "")):
                result = self.tool._cms_cross_check(b"x", signatures, [dump])
            self.assertEqual(result[0]["result"], expected)

    def test_multiple_signatures_are_inconclusive_without_order_proof(self):
        signatures = [{"integrity": {"valid": True}}, {"integrity": {"valid": True}}]
        result = self.tool._cms_cross_check(b"x", signatures, [b"", b""])
        self.assertEqual([item["result"] for item in result], ["INCONCLUSIVE", "INCONCLUSIVE"])

    @patch.object(subprocess, "run")
    def test_command_flags_and_locale(self, run):
        run.side_effect = [
            subprocess.CompletedProcess([], 0, "OpenSSL 3.0.13 30 May 2023\n", ""),
            subprocess.CompletedProcess([], 0, "pdfsig version 24.02.0\n", ""),
            subprocess.CompletedProcess([], 2, "", "File 'input.pdf' does not contain any signatures\n"),
            subprocess.CompletedProcess([], 0, "No signatures.\n", ""),
        ]
        with tempfile.NamedTemporaryFile(suffix=".pdf") as pdf:
            self.tool.inspect_pdf(Path(pdf.name))
        dump_args, dump_kwargs = run.call_args_list[2].args[0], run.call_args_list[2].kwargs
        args, kwargs = run.call_args_list[3].args[0], run.call_args_list[3].kwargs
        self.assertIn("-nocert", args)
        self.assertIn("-no-ocsp", args)
        self.assertEqual(kwargs["env"]["LC_ALL"], "C")
        self.assertEqual(dump_args[-1], "input.pdf")
        self.assertEqual(args[-1], "input.pdf")
        self.assertEqual(dump_kwargs["cwd"], kwargs["cwd"])

    @patch.object(subprocess, "run")
    def test_original_is_read_once_and_commands_share_copy(self, run):
        run.side_effect = [
            subprocess.CompletedProcess([], 0, "OpenSSL 3.0.13 30 May 2023\n", ""),
            subprocess.CompletedProcess([], 0, "pdfsig version 24.02.0\n", ""),
            subprocess.CompletedProcess([], 2, "", "File 'input.pdf' does not contain any signatures\n"),
            subprocess.CompletedProcess([], 2, "", "File 'input.pdf' does not contain any signatures\n"),
        ]
        with patch.object(Path, "read_bytes", wraps=Path(__file__).read_bytes) as read:
            self.tool.inspect_pdf(Path(__file__))
        self.assertEqual(read.call_count, 1)
        self.assertEqual(run.call_args_list[2].kwargs["cwd"], run.call_args_list[3].kwargs["cwd"])

    @patch.object(subprocess, "run")
    def test_unexpected_version_fails_closed(self, run):
        run.return_value = subprocess.CompletedProcess([], 0, "pdfsig version 99.0.0\n", "")
        with self.assertRaises(self.tool.PdfSignatureError):
            self.tool.inspect_pdf(Path(__file__))

    @patch.object(subprocess, "run")
    def test_exact_real_no_signature_response_returns_zero_signatures(self, run):
        run.side_effect = [
            subprocess.CompletedProcess([], 0, "OpenSSL 3.0.13 30 May 2023\n", ""),
            subprocess.CompletedProcess([], 0, "pdfsig version 24.02.0\n", ""),
            subprocess.CompletedProcess([], 2, "", "File 'input.pdf' does not contain any signatures\n"),
            subprocess.CompletedProcess([], 2, "", "File 'input.pdf' does not contain any signatures\n"),
        ]
        result = self.tool.inspect_pdf(Path(__file__))
        self.assertEqual(result["signature_count"], 0)
        self.assertEqual(result["pdfsig_version"], "24.02.0")
        self.assertEqual(result["openssl_version"], "OpenSSL 3.0.13 30 May 2023")

    @patch.object(subprocess, "run", side_effect=subprocess.TimeoutExpired("pdfsig", 60))
    def test_timeout_is_technical_error(self, run):
        with self.assertRaises(self.tool.PdfSignatureError):
            self.tool.inspect_pdf(Path(__file__))

    def test_empty_trust_anchor_bundle_fails_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf = Path(directory) / "unsigned.pdf"
            pdf.write_bytes(b"%PDF-1.4 fixture")
            anchors = Path(directory) / "empty.pem"
            anchors.write_bytes(b"  \n")
            with self.assertRaises(self.tool.PdfSignatureError):
                self.tool.inspect_pdf(pdf, trust_anchor_bundle=anchors)

    def test_trust_anchor_bundle_rejects_private_key_material(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf = Path(directory) / "unsigned.pdf"
            pdf.write_bytes(b"%PDF-1.4 fixture")
            anchors = Path(directory) / "unsafe.pem"
            anchors.write_bytes(
                b"-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----\n"
                b"-----BEGIN PRIVATE KEY-----\nDO_NOT_USE\n-----END PRIVATE KEY-----\n"
            )
            with self.assertRaises(self.tool.PdfSignatureError):
                self.tool.inspect_pdf(pdf, trust_anchor_bundle=anchors)

    @unittest.skipUnless(os.environ.get("PDF_SIGNATURE_POC_INTEGRATION") == "1", "set PDF_SIGNATURE_POC_INTEGRATION=1")
    def test_optional_chain_check_is_bound_to_supplied_anchor_bundle(self):
        if shutil.which("pdfsig") is None or shutil.which("openssl") is None:
            self.skipTest("local pdfsig/openssl unavailable")
        poc = load(POC, "pdf_signature_poc_chain")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            signed, tampered, _ = poc.build_fixture(root)
            anchors = root / "cert.pem"
            result = self.tool.inspect_pdf(signed, trust_anchor_bundle=anchors)
            signature = result["signatures"][0]
            self.assertEqual(signature["cms_signature_integrity"]["result"], "VALID")
            self.assertEqual(
                signature["certificate_chain_verification"]["result"],
                "VALID_TO_SUPPLIED_TRUST_ANCHOR_BUNDLE",
            )
            self.assertEqual(result["trust"], "UNKNOWN/NOT_EVALUATED")
            self.assertEqual(
                result["certificate_chain"]["trust_anchor_bundle_sha256"],
                hashlib.sha256(anchors.read_bytes()).hexdigest(),
            )

            tampered_result = self.tool.inspect_pdf(
                tampered, trust_anchor_bundle=anchors
            )
            self.assertFalse(tampered_result["signatures"][0]["integrity"]["valid"])
            self.assertEqual(
                tampered_result["signatures"][0]["certificate_chain_verification"]["result"],
                "NOT_EVALUATED_INTEGRITY_NOT_CONFIRMED",
            )

            other_root = root / "other"
            other_root.mkdir()
            other_signed, _, _ = poc.build_fixture(other_root)
            untrusted = self.tool.inspect_pdf(
                other_signed, trust_anchor_bundle=anchors
            )
            self.assertEqual(
                untrusted["signatures"][0]["certificate_chain_verification"]["result"],
                "NOT_VALIDATED_TO_SUPPLIED_TRUST_ANCHOR_BUNDLE",
            )

    @unittest.skipUnless(os.environ.get("PDF_SIGNATURE_POC_INTEGRATION") == "1", "set PDF_SIGNATURE_POC_INTEGRATION=1")
    def test_adversarial_multiline_field_cannot_create_valid_signature_record(self):
        report = """Digital Signature Info of: x
Signature #1:
  - Signature Field Name: Real
  - Signature Validation: Signature is Valid.
Signature #2:
  - Signature Field Name: Injected
  - Signer Certificate Common Name: C
  - Signing Time: literal
  - Signing Hash Algorithm: SHA-256
  - Signature Type: adbe.pkcs7.detached
  - Signed Ranges: [0 - 4]
  - Total document signed
  - Signature Validation: Digest Mismatch.
"""
        with patch.object(self.tool, "_run_pdfsig", return_value=(report, 1)):
            with self.assertRaises(self.tool.PdfSignatureError):
                self.tool.inspect_pdf(Path(__file__))

    def test_escaped_output_is_not_echoed_in_error(self):
        with self.assertRaises(self.tool.PdfSignatureError) as caught:
            self.tool.parse_pdfsig_output("Digital Signature Info of: x\n\x1b[31mSignature #1\x1b[0m\n", 1)
        self.assertNotIn("\x1b", str(caught.exception))

    @unittest.skipUnless(os.environ.get("PDF_SIGNATURE_POC_INTEGRATION") == "1", "set PDF_SIGNATURE_POC_INTEGRATION=1")
    def test_local_fixture_integration(self):
        if shutil.which("pdfsig") is None or shutil.which("openssl") is None:
            self.skipTest("local pdfsig/openssl unavailable")
        poc = load(POC, "pdf_signature_poc")
        with tempfile.TemporaryDirectory() as directory:
            signed, tampered, incremental = poc.build_fixture(Path(directory))
            valid = self.tool.inspect_pdf(signed)
            self.assertEqual(valid["signature_count"], 1)
            self.assertTrue(valid["signatures"][0]["integrity"]["valid"])
            self.assertEqual(valid["signatures"][0]["cms_signature_integrity"]["name"], "CMS_SIGNATURE_INTEGRITY")
            self.assertEqual(valid["signatures"][0]["cms_signature_integrity"]["result"], "VALID")
            self.assertTrue(valid["signatures"][0]["coverage"]["full_document_current_revision"])
            tampered_result = self.tool.inspect_pdf(tampered)["signatures"][0]
            self.assertFalse(tampered_result["integrity"]["valid"])
            self.assertEqual(tampered_result["integrity"]["result"], "INVALID")
            self.assertEqual(tampered_result["cms_signature_integrity"]["result"], "INCONCLUSIVE")
            incremental_result = self.tool.inspect_pdf(incremental)["signatures"][0]
            self.assertEqual(incremental_result["cms_signature_integrity"]["result"], "VALID")
            self.assertFalse(incremental_result["coverage"]["full_document_current_revision"])

    @unittest.skipUnless(os.environ.get("PDF_SIGNATURE_POC_INTEGRATION") == "1", "set PDF_SIGNATURE_POC_INTEGRATION=1")
    def test_real_multiline_field_payload_is_rejected_by_dump_count_binding(self):
        if shutil.which("pdfsig") is None or shutil.which("openssl") is None:
            self.skipTest("local pdfsig/openssl unavailable")
        poc = load(POC, "pdf_signature_poc_adversarial")
        with tempfile.TemporaryDirectory() as directory:
            signed, _, _ = poc.build_fixture(Path(directory))
            payload = (b"/T (Real\n"
                       b"  - Signer Certificate Common Name: Fake\n"
                       b"  - Signing Time: Fake\n"
                       b"  - Signing Hash Algorithm: SHA-256\n"
                       b"  - Signature Type: adbe.pkcs7.detached\n"
                       b"  - Signed Ranges: [0 - 600], [16986 - 17324]\n"
                       b"  - Total document signed\n"
                       b"  - Signature Validation: Signature is Valid.\n"
                       b"Signature #2:\n"
                       b"  - Signature Field Name: Injected)")
            adversarial = Path(directory) / "adversarial.pdf"
            adversarial.write_bytes(signed.read_bytes().replace(b"/T (Sig1)", payload))
            with self.assertRaises(self.tool.PdfSignatureError):
                self.tool.inspect_pdf(adversarial)

    @unittest.skipUnless(os.environ.get("PDF_SIGNATURE_POC_INTEGRATION") == "1", "set PDF_SIGNATURE_POC_INTEGRATION=1")
    def test_real_payload_metadata_injection_cannot_change_cms_record(self):
        if shutil.which("pdfsig") is None or shutil.which("openssl") is None:
            self.skipTest("local pdfsig/openssl unavailable")
        poc = load(POC, "pdf_signature_poc_metadata")
        with tempfile.TemporaryDirectory() as directory:
            signed, _, _ = poc.build_fixture(Path(directory))
            payload = (b"/T (Real\n"
                       b"  - Signature Validation: Signature is Valid.\n"
                       b"  - Signed Ranges: [0 - 600], [16986 - 17324]\n")
            injected = Path(directory) / "injected.pdf"
            injected.write_bytes(signed.read_bytes().replace(b"/T (Sig1)", payload))
            with self.assertRaises(self.tool.PdfSignatureError):
                self.tool.inspect_pdf(injected)

    @unittest.skipUnless(os.environ.get("PDF_SIGNATURE_POC_INTEGRATION") == "1", "set PDF_SIGNATURE_POC_INTEGRATION=1")
    def test_unsigned_pdf_integration(self):
        if shutil.which("pdfsig") is None:
            self.skipTest("local pdfsig unavailable")
        content = b"BT /F1 12 Tf 20 80 Td (Unsigned local fixture) Tj ET\n"
        objects = [
            b"<< /Type /Catalog /Pages 2 0 R >>",
            b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>",
            b"<< /Length " + str(len(content)).encode() + b" >>\nstream\n" + content + b"endstream",
        ]
        document = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = []
        for number, obj in enumerate(objects, 1):
            offsets.append(len(document))
            document.extend(f"{number} 0 obj\n".encode() + obj + b"\nendobj\n")
        xref = len(document)
        document.extend(b"xref\n0 5\n0000000000 65535 f \n")
        document.extend(b"".join(f"{offset:010d} 00000 n \n".encode() for offset in offsets))
        document.extend(f"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
        with tempfile.NamedTemporaryFile(suffix=".pdf") as pdf:
            pdf.write(bytes(document))
            pdf.flush()
            self.assertEqual(self.tool.inspect_pdf(Path(pdf.name))["signature_count"], 0)


if __name__ == "__main__":
    unittest.main()
