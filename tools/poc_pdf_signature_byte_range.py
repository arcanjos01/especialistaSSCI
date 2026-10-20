#!/usr/bin/env python3
"""Optional local proof of PDF ByteRange/CMS verification.

Requires OpenSSL and Poppler's pdfsig. Generates all keys and PDF fixtures in a
temporary directory. It is a test harness, not a production trust decision or
an Apps Script verifier.
"""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path


PLACEHOLDER_HEX_LENGTH = 16384


def run(args: list[str], *, capture: bool = False) -> str:
    completed = subprocess.run(
        args,
        check=True,
        text=True,
        stdout=subprocess.PIPE if capture else subprocess.DEVNULL,
        stderr=subprocess.STDOUT if capture else subprocess.DEVNULL,
    )
    return completed.stdout or ""


def build_fixture(directory: Path) -> tuple[Path, Path]:
    key = directory / "key.pem"
    cert = directory / "cert.pem"
    run(
        [
            "openssl", "req", "-x509", "-newkey", "rsa:2048", "-keyout", str(key),
            "-out", str(cert), "-days", "1", "-nodes", "-subj",
            "/CN=SSCI Local PDF Signature POC",
        ]
    )

    content_stream = b"BT /F1 12 Tf 20 80 Td (Local signed fixture) Tj ET\n"
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R /AcroForm << /SigFlags 3 /Fields [6 0 R] >> >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R "
        b"/Resources << /Font << /F1 << /Type /Font /Subtype /Type1 "
        b"/BaseFont /Helvetica >> >> >> /Annots [6 0 R] >>",
        b"<< /Length " + str(len(content_stream)).encode() + b" >>\nstream\n"
        + content_stream + b"endstream",
        b"<< /Type /Sig /Filter /Adobe.PPKLite /SubFilter /adbe.pkcs7.detached "
        b"/ByteRange [0000000000 0000000000 0000000000 0000000000] /Contents <"
        + b"0" * PLACEHOLDER_HEX_LENGTH
        + b"> /Name (Local POC) >>",
        b"<< /Type /Annot /Subtype /Widget /FT /Sig /T (Sig1) /V 5 0 R /Rect [0 0 0 0] /P 3 0 R >>",
    ]
    pdf = bytearray(b"%PDF-1.7\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for number, obj in enumerate(objects, 1):
        offsets.append(len(pdf))
        pdf.extend(f"{number} 0 obj\n".encode() + obj + b"\nendobj\n")
    xref = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode() + b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode())
    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref}\n%%EOF\n".encode()
    )

    byte_range_marker = b"/ByteRange [0000000000 0000000000 0000000000 0000000000]"
    range_start = pdf.index(byte_range_marker) + len(b"/ByteRange [")
    contents_lt = pdf.index(b"/Contents <") + len(b"/Contents ")
    contents_gt = pdf.index(b">", contents_lt)
    ranges = (0, contents_lt, contents_gt + 1, len(pdf) - contents_gt - 1)
    rendered_ranges = " ".join(f"{value:010d}" for value in ranges).encode()
    pdf[range_start : range_start + len(rendered_ranges)] = rendered_ranges

    signed_bytes = directory / "signed-bytes.bin"
    signed_bytes.write_bytes(pdf[:contents_lt] + pdf[contents_gt + 1 :])
    cms = directory / "signature.der"
    run(
        [
            "openssl", "cms", "-sign", "-binary", "-in", str(signed_bytes),
            "-signer", str(cert), "-inkey", str(key), "-outform", "DER",
            "-out", str(cms), "-nosmimecap", "-md", "sha256",
        ]
    )
    cms_hex = cms.read_bytes().hex().encode()
    if len(cms_hex) > PLACEHOLDER_HEX_LENGTH:
        raise RuntimeError("CMS signature exceeds the PDF Contents placeholder")
    pdf[contents_lt + 1 : contents_gt] = cms_hex + b"0" * (
        PLACEHOLDER_HEX_LENGTH - len(cms_hex)
    )

    signed_pdf = directory / "signed.pdf"
    signed_pdf.write_bytes(pdf)
    tampered = bytearray(pdf)
    signed_content = tampered.index(b"Local signed fixture")
    tampered[signed_content] = ord("X")
    tampered_pdf = directory / "tampered.pdf"
    tampered_pdf.write_bytes(tampered)
    return signed_pdf, tampered_pdf


def main() -> None:
    missing = [name for name in ("openssl", "pdfsig") if shutil.which(name) is None]
    if missing:
        raise SystemExit("Missing required local tools: " + ", ".join(missing))
    with tempfile.TemporaryDirectory(prefix="ssci-pdfsig-poc-") as temp:
        signed_pdf, tampered_pdf = build_fixture(Path(temp))
        valid_report = run(["pdfsig", str(signed_pdf)], capture=True)
        if "Signature Validation: Signature is Valid." not in valid_report:
            raise SystemExit("Valid fixture was not cryptographically validated:\n" + valid_report)
        if "Certificate Validation: Certificate issuer isn't Trusted." not in valid_report:
            raise SystemExit("Fixture did not demonstrate the untrusted certificate state:\n" + valid_report)

        tampered_report = run(["pdfsig", str(tampered_pdf)], capture=True)
        if "Signature Validation: Digest Mismatch." not in tampered_report:
            raise SystemExit("Tampered fixture was not rejected:\n" + tampered_report)

        print("PASS: PDF ByteRange/CMS signature is valid for the generated fixture.")
        print("PASS: its self-signed certificate is explicitly reported untrusted.")
        print("PASS: changing a signed byte produces Digest Mismatch.")
        print("LIMIT: does not establish PAdES policy, trusted issuer, council identity, revocation, or Apps Script capability.")


if __name__ == "__main__":
    main()
