"""
pipeline.py
Pipeline embedding untuk AI Knowledge Base.

Alur:

    ProcessedDocument
            ↓
    embed_document()
            ↓
    EmbeddedDocument

Output berupa EmbeddedDocument yang berisi:

    - metadata
    - embedded_chunks

Tahap selanjutnya (di luar pipeline ini):

    vector database
"""

from __future__ import annotations

from app.services.preprocessing.models import ProcessedDocument

from .embedder import DEFAULT_MODEL, embed_document
from .models import EmbeddedDocument


def embedding_pipeline(
    doc: ProcessedDocument,
    model_name: str = DEFAULT_MODEL,
) -> EmbeddedDocument:
    """
    Menjalankan seluruh pipeline embedding.

    Alur:

        ProcessedDocument
                ↓
            Embedding

    Parameters
    ----------
    doc:
        Hasil preprocessing.
    model_name:
        Nama model SentenceTransformer yang digunakan.

    Returns
    -------
    EmbeddedDocument
    """

    return embed_document(
        doc=doc,
        model_name=model_name,
    )