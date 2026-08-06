"""
Package preprocessing untuk AI Knowledge Base (RAG pipeline).

Pipeline preprocessing:

    extract_document()
            ↓
    build_metadata()
            ↓
    clean_document()
            ↓
    chunk_document()

Setiap tahap menerima dan mengembalikan ProcessedDocument yang sama
(lihat models.py), sehingga informasi dokumen tetap terjaga sepanjang
pipeline.

Contoh penggunaan:

    from preprocessing import preprocess_document

    doc = preprocess_document(filepath)

    if doc.success:
        print(doc.metadata)
        print(doc.num_segments)
        print(doc.num_chunks)
"""

from .cleaner import clean_document, clean_text
from .chunker import chunk_document
from .extractor import extract_document
from .metadata import build_metadata
from .models import (
    DocumentChunk,
    DocumentMetadata,
    DocumentSegment,
    ProcessedDocument,
)
from .pipeline import preprocess_document

__all__ = [
    "extract_document",
    "build_metadata",
    "clean_document",
    "clean_text",
    "chunk_document",
    "preprocess_document",
    "ProcessedDocument",
    "DocumentSegment",
    "DocumentChunk",
    "DocumentMetadata",
]