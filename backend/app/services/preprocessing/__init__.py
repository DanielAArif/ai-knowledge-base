"""
Package preprocessing untuk AI Knowledge Base (RAG pipeline).

Alur:
    extract_document() -> build_metadata() -> clean_document() -> chunk_document()
    (extractor.py)        (metadata.py)       (cleaner.py)        (chunker.py, menyusul)

Semua tahap menerima & mengembalikan ProcessedDocument yang sama
(lihat models.py), supaya tidak ada informasi yang hilang di tengah jalan.

Contoh pemakaian dari pipeline.py:

    from preprocessing import extract_document, build_metadata, clean_document

    doc = extract_document(filepath)
    doc = build_metadata(filepath, doc)
    doc = clean_document(doc)
"""

from .cleaner import clean_document, clean_text
from .extractor import extract_document
from .metadata import build_metadata
from .models import DocumentMetadata, DocumentSegment, ProcessedDocument

__all__ = [
    "extract_document",
    "build_metadata",
    "clean_document",
    "clean_text",
    "ProcessedDocument",
    "DocumentSegment",
    "DocumentMetadata",
]