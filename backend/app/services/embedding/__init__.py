"""
Package embedding untuk AI Knowledge Base.

Pipeline embedding:

    ProcessedDocument
            ↓
    embed_document()
            ↓
    EmbeddedDocument

Tahap ini bertugas mengubah setiap DocumentChunk hasil preprocessing
menjadi embedding vector menggunakan SentenceTransformer.

Output dari package ini adalah EmbeddedDocument yang siap disimpan ke
vector database (mis. ChromaDB).

Contoh penggunaan:

    from app.services.embedding import embedding_pipeline

    embedded_doc = embedding_pipeline(processed_doc)

    print(embedded_doc.num_chunks)
"""

from .embedder import DocumentEmbedder, embed_document
from .models import EmbeddedChunk, EmbeddedDocument
from .pipeline import embedding_pipeline

__all__ = [
    "DocumentEmbedder",
    "embed_document",
    "embedding_pipeline",
    "EmbeddedChunk",
    "EmbeddedDocument",
]