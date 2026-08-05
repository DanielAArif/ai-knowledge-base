"""
extractor.py
Tahap pertama pipeline: extractor -> metadata -> cleaner -> chunker

Tanggung jawab modul ini HANYA satu: mengubah file (DOCX, PDF) menjadi teks
+ segmen (per halaman). Metadata (title/author) diisi belakangan oleh
metadata.py, pembersihan teks dilakukan oleh cleaner.py - keduanya tidak
disentuh di sini.

Scope saat ini: DOCX dan PDF. PPTX menyusul (tinggal tambah PptxExtractor
mengikuti pola yang sama).

Dependencies:
    pip install pypdf docx2txt langchain-community --break-system-packages

Menjalankan manual test file ini langsung (relative import butuh konteks
package):
    cd /path/ke/parent/preprocessing/..
    python3 -m preprocessing.extractor <path_to_file>
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

from langchain_community.document_loaders import Docx2txtLoader, PyPDFLoader
from pypdf.errors import FileNotDecryptedError, PdfReadError

from .models import DocumentSegment, ProcessedDocument


class BaseExtractor:
    supported_extensions: tuple[str, ...] = ()

    def extract(self, filepath: str) -> ProcessedDocument:
        raise NotImplementedError


class DocxExtractor(BaseExtractor):
    """
    Pakai Docx2txtLoader (LangChain), yang di bawahnya memakai library
    docx2txt: membuka file sebagai zip lalu parsing word/document.xml
    secara manual (BUKAN python-docx). Karena itu exception yang relevan
    adalah error zip/XML, bukan exception khas python-docx.
    """
    supported_extensions = (".docx",)

    def extract(self, filepath: str) -> ProcessedDocument:
        try:
            loader = Docx2txtLoader(filepath)
            docs = loader.load()
        except zipfile.BadZipFile as e:
            return ProcessedDocument(error=f"File bukan format DOCX yang valid (bukan zip OOXML): {e}")
        except KeyError as e:
            return ProcessedDocument(error=f"Struktur DOCX tidak lengkap, entri {e} tidak ditemukan")
        except ET.ParseError as e:
            return ProcessedDocument(error=f"Isi DOCX tidak bisa di-parse (XML rusak): {e}")
        except FileNotFoundError as e:
            return ProcessedDocument(error=f"File tidak ditemukan: {e}")

        full_text = "\n".join(d.page_content for d in docs).strip()
        segments = [DocumentSegment(index=1, text=full_text)]

        return ProcessedDocument(full_text=full_text, segments=segments)


class PdfExtractor(BaseExtractor):
    """
    Pakai PyPDFLoader (LangChain) - otomatis membagi 1 Document per halaman
    lewat pypdf, cocok untuk kebutuhan "tampilkan sumber jawaban -> nomor
    halaman" di fitur AI Chat.
    """
    supported_extensions = (".pdf",)

    def extract(self, filepath: str) -> ProcessedDocument:
        try:
            loader = PyPDFLoader(filepath)
            docs = loader.load()
        except FileNotDecryptedError as e:
            return ProcessedDocument(error=f"File PDF terkunci password: {e}")
        except PdfReadError as e:
            return ProcessedDocument(error=f"File PDF tidak valid/rusak: {e}")
        except FileNotFoundError as e:
            return ProcessedDocument(error=f"File tidak ditemukan: {e}")

        segments = [
            DocumentSegment(index=d.metadata.get("page", i) + 1, text=d.page_content.strip())
            for i, d in enumerate(docs)
        ]
        full_text = "\n\n".join(s.text for s in segments if s.text)

        return ProcessedDocument(full_text=full_text, segments=segments)


_EXTRACTORS: list[BaseExtractor] = [
    DocxExtractor(),
    PdfExtractor(),
]

_EXT_MAP: dict[str, BaseExtractor] = {
    ext: extractor
    for extractor in _EXTRACTORS
    for ext in extractor.supported_extensions
}


def extract_document(filepath: str) -> ProcessedDocument:
    """
    Entry point utama. Hasilnya belum punya metadata (lihat metadata.py)
    dan belum dibersihkan (lihat cleaner.py) - digabungkan di pipeline.py.
    """
    ext = Path(filepath).suffix.lower()
    extractor = _EXT_MAP.get(ext)

    if extractor is None:
        return ProcessedDocument(
            error=(
                f"Format file '{ext}' belum didukung. "
                f"Saat ini hanya: {list(_EXT_MAP.keys())}"
            )
        )

    doc = extractor.extract(filepath)

    if doc.success and not doc.full_text.strip():
        doc.error = "Tidak ada teks yang bisa diekstrak dari dokumen ini."

    return doc


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python -m preprocessing.extractor <path_to_file>")
        sys.exit(1)

    result = extract_document(sys.argv[1])
    print(f"Segments : {result.num_segments}")
    print(f"Success  : {result.success}")
    if result.error:
        print(f"Error    : {result.error}")
    else:
        print(f"Preview  : {result.full_text[:300]}...")