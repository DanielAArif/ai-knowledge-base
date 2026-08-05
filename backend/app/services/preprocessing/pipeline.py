"""
pipeline.py
Pipeline preprocessing AI Knowledge Base.

Urutan proses:

    extract_document()
            ↓
    build_metadata()
            ↓
    clean_document()
            ↓
    chunk_document()

Output akhir berupa ProcessedDocument yang berisi:

    - full_text
    - metadata
    - segments
    - chunks

Tahap selanjutnya (di luar preprocessing):

    embedding
        ↓
    vector database
"""

from __future__ import annotations

from .chunker import chunk_document
from .cleaner import clean_document
from .extractor import extract_document
from .metadata import build_metadata
from .models import ProcessedDocument


def preprocess_document(filepath: str) -> ProcessedDocument:
    """
    Menjalankan seluruh pipeline preprocessing.

    Alur:

        Extract
            ↓
        Metadata
            ↓
        Cleaning
            ↓
        Chunking

    Jika salah satu tahap gagal, ProcessedDocument yang mengandung error
    langsung dikembalikan.
    """

    doc = extract_document(filepath)

    if not doc.success:
        return doc

    doc = build_metadata(filepath, doc)

    if not doc.success:
        return doc

    doc = clean_document(doc)

    if not doc.success:
        return doc

    doc = chunk_document(doc)

    return doc