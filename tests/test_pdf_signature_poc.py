import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
POC = ROOT / "tools" / "poc_pdf_signature_byte_range.py"


def load_poc():
    spec = importlib.util.spec_from_file_location("pdf_signature_poc", POC)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


class PdfSignaturePocTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.poc = load_poc()

    def test_parse_byte_range(self):
        self.assertEqual(
            self.poc.parse_byte_range(b"/ByteRange [0 12 34 56]"),
            (0, 12, 34, 56),
        )

    def test_unsigned_incremental_revision_preserves_prefix_and_chains_xref(self):
        original = (
            b"%PDF-1.7\n"
            b"xref\n0 1\n0000000000 65535 f \n"
            b"trailer\n<< /Size 7 /Root 1 0 R >>\n"
            b"startxref\n9\n%%EOF\n"
        )
        revised = self.poc.append_unsigned_incremental_revision(original)
        appended = revised[len(original):]

        self.assertTrue(revised.startswith(original))
        self.assertIn(b"3 0 obj", appended)
        self.assertIn(b"7 0 obj", appended)
        self.assertIn(b"Unsigned incremental revision", appended)
        self.assertIn(b"/Prev 9", appended)

        xref_offset = revised.index(b"xref\n3 1", len(original))
        self.assertEqual(self.poc.parse_startxref(revised), xref_offset)
        self.assertIn(f"{len(original) + 1:010d} 00000 n ".encode(), appended)


if __name__ == "__main__":
    unittest.main()
