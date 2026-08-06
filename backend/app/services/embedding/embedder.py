"""
embedder.py
Tahap pertama embedding pipeline.

Tanggung jawab modul ini:
- Memuat embedding model.
- Mengubah setiap DocumentChunk menjadi EmbeddedChunk.
- Menghasilkan EmbeddedDocument.

Modul ini TIDAK bertugas:
- Menyimpan ke ChromaDB.
- Melakukan similarity search.
- Berinteraksi dengan LLM.

Dependencies:
    pip install sentence-transformers
"""

from __future__ import annotations

from sentence_transformers import SentenceTransformer

from app.services.preprocessing.models import ProcessedDocument
from .models import EmbeddedChunk, EmbeddedDocument


DEFAULT_MODEL = "BAAI/bge-m3"


class DocumentEmbedder:
    """
    Embedder berbasis SentenceTransformer.
    """

    def __init__(self, model_name: str = DEFAULT_MODEL):
        self.model = SentenceTransformer(model_name)

    def embed(self, doc: ProcessedDocument) -> EmbeddedDocument:
        """
        Mengubah seluruh DocumentChunk menjadi EmbeddedChunk.
        """

        if not doc.success:
            raise ValueError(doc.error)

        embedded_chunks: list[EmbeddedChunk] = []

        for chunk in doc.chunks:
            embedding = self.model.encode(
                chunk.text,
                normalize_embeddings=True,
            )

            embedded_chunks.append(
                EmbeddedChunk(
                    chunk_id=chunk.chunk_id,
                    segment_index=chunk.segment_index,
                    text=chunk.text,
                    embedding=embedding.tolist(),
                )
            )

        return EmbeddedDocument(
            metadata=doc.metadata,
            embedded_chunks=embedded_chunks,
        )


def embed_document(
    doc: ProcessedDocument,
    model_name: str = DEFAULT_MODEL,
) -> EmbeddedDocument:
    """
    Entry point utama.

    Contoh:

        processed = preprocess_document(filepath)

        embedded = embed_document(processed)

        print(embedded.num_chunks)
    """

    embedder = DocumentEmbedder(model_name)

    return embedder.embed(doc)


if __name__ == "__main__":
    print(
        "Embedder adalah bagian dari embedding pipeline.\n"
        "Jalankan melalui pipeline.py untuk pengujian."
    )