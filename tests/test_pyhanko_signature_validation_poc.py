"""Optional, isolated tests for the pyHanko PDF signature validation spike."""

from __future__ import annotations

import importlib.util
import logging
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

try:
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.x509.oid import NameOID
    from pyhanko.keys import load_cert_from_pemder
    from importlib.metadata import version

    POC_DEPENDENCIES_AVAILABLE = version("pyHanko") == "0.38.0"
except Exception:
    POC_DEPENDENCIES_AVAILABLE = False

from tools import poc_pyhanko_signature_validation as spike


ROOT = Path(__file__).resolve().parents[1]
BYTE_RANGE_POC = ROOT / "tools" / "poc_pdf_signature_byte_range.py"


def _load_byte_range_poc():
    spec = importlib.util.spec_from_file_location("byte_range_poc_for_pyhanko", BYTE_RANGE_POC)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


@unittest.skipUnless(POC_DEPENDENCIES_AVAILABLE, "optional pyHanko 0.38.0 and cryptography dependencies unavailable")
class PyHankoLocalSignatureValidationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._previous_logging_disable = logging.root.manager.disable
        logging.disable(logging.CRITICAL)
        cls.byte_range_poc = _load_byte_range_poc()

    @classmethod
    def tearDownClass(cls):
        logging.disable(cls._previous_logging_disable)

    def _make_signed_pdf(self, folder: Path, *, revoked: bool = False):
        now = datetime.now(timezone.utc)
        root_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        root_name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "Offline SSCI Test CA")])
        root_cert = (
            x509.CertificateBuilder()
            .subject_name(root_name)
            .issuer_name(root_name)
            .public_key(root_key.public_key())
            .serial_number(1001)
            .not_valid_before(now - timedelta(days=2))
            .not_valid_after(now + timedelta(days=365))
            .add_extension(x509.BasicConstraints(ca=True, path_length=1), critical=True)
            .add_extension(
                x509.KeyUsage(False, False, False, False, False, True, True, False, False),
                critical=True,
            )
            .sign(root_key, hashes.SHA256())
        )
        signer_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        signer_name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "Offline SSCI Test Signer")])
        signer_cert = (
            x509.CertificateBuilder()
            .subject_name(signer_name)
            .issuer_name(root_name)
            .public_key(signer_key.public_key())
            .serial_number(2002)
            .not_valid_before(now - timedelta(days=2))
            .not_valid_after(now + timedelta(days=30))
            .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
            .add_extension(
                x509.KeyUsage(True, True, False, False, False, False, False, False, False),
                critical=True,
            )
            .add_extension(
                x509.CRLDistributionPoints(
                    [x509.DistributionPoint(
                        [x509.UniformResourceIdentifier("http://offline.invalid/test.crl")],
                        None, None, None,
                    )]
                ),
                critical=False,
            )
            .sign(root_key, hashes.SHA256())
        )
        signer_key_path = folder / "key.pem"
        signer_cert_path = folder / "cert.pem"
        root_cert_path = folder / "root.pem"
        signer_key_path.write_bytes(
            signer_key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.TraditionalOpenSSL,
                serialization.NoEncryption(),
            )
        )
        signer_cert_path.write_bytes(signer_cert.public_bytes(serialization.Encoding.PEM))
        root_cert_path.write_bytes(root_cert.public_bytes(serialization.Encoding.PEM))

        original_run = self.byte_range_poc.run

        def use_prebuilt_identity(args, **kwargs):
            if args[:2] == ["openssl", "req"]:
                return ""
            return original_run(args, **kwargs)

        with patch.object(self.byte_range_poc, "run", side_effect=use_prebuilt_identity):
            signed_pdf, tampered_pdf, _ = self.byte_range_poc.build_fixture(folder)

        revoked_cert = None
        if revoked:
            revoked_cert = (
                x509.RevokedCertificateBuilder()
                .serial_number(signer_cert.serial_number)
                .revocation_date(now - timedelta(hours=1))
                .build()
            )
        crl_builder = (
            x509.CertificateRevocationListBuilder()
            .issuer_name(root_name)
            .last_update(now - timedelta(days=1))
            .next_update(now + timedelta(days=7))
        )
        if revoked_cert is not None:
            crl_builder = crl_builder.add_revoked_certificate(revoked_cert)
        crl_der = crl_builder.sign(root_key, hashes.SHA256()).public_bytes(serialization.Encoding.DER)
        return (
            signed_pdf,
            tampered_pdf,
            load_cert_from_pemder(root_cert_path),
            crl_der,
        )

    def _inspect(self, path, *, roots, crls):
        return spike.validate_pdf_bytes(
            path.read_bytes(),
            profile_id="synthetic-offline-test-profile",
            profile_version="1",
            trust_roots=roots,
            crls_der=crls,
        )

    def test_explicit_trust_and_valid_crl_are_reported_separately(self):
        with tempfile.TemporaryDirectory() as directory:
            signed, _, root, crl = self._make_signed_pdf(Path(directory))
            result = self._inspect(signed, roots=[root], crls=[crl])
        signature = result["signatures"][0]
        self.assertEqual(signature["integrity"], "VALID")
        self.assertEqual(signature["certificate_trust"], "TRUSTED")
        self.assertEqual(signature["revocation"], "NOT_REVOKED_IN_VALIDATED_CONTEXT")
        self.assertTrue(signature["current_file_fully_covered"])
        self.assertEqual(result["admission"], "NOT_DECIDED")
        self.assertEqual(result["network_fetching"], "DISABLED")

    def test_missing_crl_does_not_become_trusted_or_revoked(self):
        with tempfile.TemporaryDirectory() as directory:
            signed, _, root, _ = self._make_signed_pdf(Path(directory))
            result = self._inspect(signed, roots=[root], crls=[])
        signature = result["signatures"][0]
        self.assertEqual(signature["integrity"], "VALID")
        self.assertEqual(signature["certificate_trust"], "NOT_TRUSTED")
        self.assertEqual(signature["revocation"], "UNKNOWN/NOT_EVALUATED")
        self.assertFalse(signature["bottom_line"])

    def test_revoked_signer_is_not_trusted(self):
        with tempfile.TemporaryDirectory() as directory:
            signed, _, root, crl = self._make_signed_pdf(Path(directory), revoked=True)
            result = self._inspect(signed, roots=[root], crls=[crl])
        signature = result["signatures"][0]
        self.assertEqual(signature["integrity"], "VALID")
        self.assertEqual(signature["certificate_trust"], "NOT_TRUSTED")
        self.assertEqual(signature["revocation"], "REVOKED")
        self.assertFalse(signature["bottom_line"])

    def test_tampered_content_and_untrusted_anchor_fail_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            signed, tampered, root, crl = self._make_signed_pdf(Path(directory))
            wrong_root_dir = Path(directory) / "wrong-root"
            wrong_root_dir.mkdir()
            _, _, wrong_root, _ = self._make_signed_pdf(wrong_root_dir)
            tampered_result = self._inspect(tampered, roots=[root], crls=[crl])
            untrusted_result = self._inspect(signed, roots=[wrong_root], crls=[crl])
        self.assertEqual(tampered_result["signatures"][0]["integrity"], "INVALID")
        self.assertFalse(tampered_result["signatures"][0]["bottom_line"])
        self.assertEqual(untrusted_result["signatures"][0]["integrity"], "VALID")
        self.assertEqual(untrusted_result["signatures"][0]["certificate_trust"], "NOT_TRUSTED")
        self.assertFalse(untrusted_result["signatures"][0]["bottom_line"])

    def test_invalid_profile_inputs_are_rejected(self):
        with self.assertRaises(spike.PdfValidationSpikeError):
            spike.validate_pdf_bytes(
                b"%PDF", profile_id="", profile_version="1", trust_roots=[], crls_der=[]
            )
        with self.assertRaises(spike.PdfValidationSpikeError):
            spike.validate_pdf_bytes(
                b"%PDF", profile_id="test", profile_version="1", trust_roots=[], crls_der=[b""]
            )
        with self.assertRaises(spike.PdfValidationSpikeError):
            spike.validate_pdf_bytes(
                b"%PDF", profile_id="test", profile_version="1", trust_roots=[object()], crls_der=[]
            )


if __name__ == "__main__":
    unittest.main()
