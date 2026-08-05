"""
metadata.py
Tahap kedua pipeline: extractor -> metadata -> cleaner -> chunker

Tanggung jawab modul ini: mengisi ProcessedDocument.metadata (filename,
file_type, title, author). Berjalan SETELAH extractor.py dan SEBELUM
cleaner.py, supaya metadata sudah menempel di ProcessedDocument sebelum
teksnya diubah-ubah oleh tahap berikutnya.

title/author dibaca ULANG dari file asli (bukan dari full_text hasil
extractor.py), karena informasi ini disimpan sebagai core properties di
struktur file DOCX/PDF - bukan bagian dari isi teks.

Dependencies:
    pip install python-docx pypdf --break-system-packages
"""

from __future__ import annotations

import os
import zipfile
from pathlib import Path
from typing import Callable

from docx import Document as DocxDocument
from docx.opc.exceptions import PackageNotFoundError as DocxPackageNotFoundError
from pypdf import PdfReader
from pypdf.errors import FileNotDecryptedError, PdfReadError

from .models import DocumentMetadata, ProcessedDocument


def _read_docx_properties(filepath: str) -> tuple[str, str]:
    try:
        doc = DocxDocument(filepath)
        props = doc.core_properties
        return props.title or "", props.author or ""
    except (DocxPackageNotFoundError, zipfile.BadZipFile):
        # Kalau gagal baca properti, jangan gagalkan seluruh pipeline -
        # title/author cuma pelengkap, bukan hal wajib.
        return "", ""


def _read_pdf_properties(filepath: str) -> tuple[str, str]:
    try:
        reader = PdfReader(filepath)
        meta = reader.metadata or {}
        return meta.get("/Title", "") or "", meta.get("/Author", "") or ""
    except (PdfReadError, FileNotDecryptedError):
        return "", ""


_PROPERTY_READERS: dict[str, Callable[[str], tuple[str, str]]] = {
    ".docx": _read_docx_properties,
    ".pdf": _read_pdf_properties,
}


def build_metadata(filepath: str, doc: ProcessedDocument) -> ProcessedDocument:
    """
    Entry point utama, dipanggil dari pipeline.py setelah extract_document().

    Contoh pemakaian:

        doc = extract_document(filepath)
        doc = build_metadata(filepath, doc)
        doc = clean_document(doc)
    """
    if not doc.success:
        # Tidak ada gunanya baca metadata kalau tahap ekstraksi sudah gagal.
        return doc

    ext = Path(filepath).suffix.lower()
    reader = _PROPERTY_READERS.get(ext)
    title, author = reader(filepath) if reader else ("", "")

    metadata = DocumentMetadata(
        filename=os.path.basename(filepath),
        file_type=ext.lstrip("."),
        title=title,
        author=author,
    )

    return doc.with_metadata(metadata)


if __name__ == "__main__":
    import sys

    from .extractor import extract_document

    if len(sys.argv) < 2:
        print("Usage: python -m preprocessing.metadata <path_to_file>")
        sys.exit(1)

    result = extract_document(sys.argv[1])
    result = build_metadata(sys.argv[1], result)
    print(f"Metadata : {result.metadata}")