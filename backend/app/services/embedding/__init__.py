"""
Package embedding untuk AI Knowledge Base (RAG pipeline).

Alur:

    ProcessedDocument
            │
            ▼
    DocumentEmbedder.embed()
            │
            ▼
    EmbeddedDocument

Modul ini bertugas mengubah setiap DocumentChunk menjadi vector embedding
menggunakan SentenceTransformer.

Untuk penggunaan produksi, disarankan membuat satu instance
DocumentEmbedder saat startup aplikasi dan menggunakannya kembali
(reuse) untuk seluruh proses embedding.

Contoh:

    from app.services.preprocessing import preprocess_document
    from app.services.embedding import DocumentEmbedder

    embedder = DocumentEmbedder()      # model di-load sekali

    processed = preprocess_document(filepath)

    if processed.success:
        embedded = embedder.embed(processed)

        if embedded.success:
            print(embedded.num_chunks)

Fungsi embed_document() tetap disediakan sebagai helper untuk
testing atau penggunaan sederhana.
"""

from .embedder import DocumentEmbedder, embed_document
from .models import EmbeddedChunk, EmbeddedDocument

__all__ = [
    "DocumentEmbedder",
    "embed_document",
    "EmbeddedChunk",
    "EmbeddedDocument",
]