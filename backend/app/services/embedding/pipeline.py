"""
pipeline.py
Pipeline embedding untuk AI Knowledge Base.

Alur:

    ProcessedDocument
            │
            ▼
    DocumentEmbedder.embed()
            │
            ▼
    EmbeddedDocument

Output berupa EmbeddedDocument yang berisi:

- metadata
- embedded_chunks

Tahap selanjutnya:

    ChromaDB / Vector Store
"""

from __future__ import annotations

from ..preprocessing.models import ProcessedDocument

from .embedder import DocumentEmbedder, embed_document
from .models import EmbeddedDocument


def embedding_pipeline(
    doc: ProcessedDocument,
    embedder: DocumentEmbedder | None = None,
) -> EmbeddedDocument:
    """
    Menjalankan seluruh pipeline embedding.

    Parameters
    ----------
    doc:
        Hasil preprocessing.

    embedder:
        Instance DocumentEmbedder.

        Jika None, pipeline akan membuat instance baru.
        Untuk production, sebaiknya satu instance dibuat saat
        startup aplikasi lalu digunakan kembali.

    Returns
    -------
    EmbeddedDocument
    """

    return embed_document(
        doc=doc,
        embedder=embedder,
    )