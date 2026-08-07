"""
embedder.py
Tahap pertama embedding pipeline.

Tanggung jawab modul ini:

- Memuat embedding model.
- Mengubah seluruh DocumentChunk sebuah dokumen menjadi EmbeddedChunk
  lewat satu pemanggilan batch.
- Menghasilkan EmbeddedDocument.

Modul ini TIDAK bertugas:

- Menyimpan ke ChromaDB.
- Melakukan similarity search.
- Berinteraksi dengan LLM.

Catatan penting soal model E5 (intfloat/multilingual-e5-*):
Model ini dilatih dengan konvensi prefix WAJIB - teks yang di-embed
sebagai dokumen harus diberi prefix "passage: ", sedangkan query saat
pencarian harus diberi prefix "query: ".

Prefix ini hanya diterapkan otomatis jika model yang digunakan adalah
keluarga E5. Model lain (mis. BAAI/bge-m3 atau all-MiniLM-L6-v2) tidak
memerlukan prefix tersebut.

Dependencies:
pip install sentence-transformers
"""

from __future__ import annotations

from sentence_transformers import SentenceTransformer

from ..preprocessing.models import ProcessedDocument
from .models import EmbeddedChunk, EmbeddedDocument

DEFAULT_MODEL = "intfloat/multilingual-e5-small"

_E5_PASSAGE_PREFIX = "passage: "


class DocumentEmbedder:
    """
    Embedder berbasis SentenceTransformer.

    Instance sebaiknya dibuat sekali (mis. saat startup FastAPI),
    lalu dipakai berulang kali agar model tidak perlu di-load ulang.
    """

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL,
        batch_size: int = 32,
    ):
        self.model_name = model_name
        self.batch_size = batch_size
        self.model = SentenceTransformer(model_name)

    def _prepare_text(self, text: str) -> str:
        """
        Menyesuaikan format teks berdasarkan embedding model.

        Model keluarga E5 membutuhkan prefix "passage:" untuk dokumen.
        Model lain dikembalikan apa adanya.
        """
        if "e5" in self.model_name.lower():
            return f"{_E5_PASSAGE_PREFIX}{text}"

        return text

    def embed(self, doc: ProcessedDocument) -> EmbeddedDocument:
        """
        Mengubah seluruh DocumentChunk menjadi EmbeddedChunk.

        Seluruh chunk diproses dalam satu batch agar lebih cepat daripada
        melakukan encode satu per satu.
        """

        if not doc.success:
            return EmbeddedDocument(
                metadata=doc.metadata,
                error=doc.error,
            )

        if not doc.chunks:
            return EmbeddedDocument(
                metadata=doc.metadata,
                error="ProcessedDocument contains no chunks.",
            )

        texts = [
            self._prepare_text(chunk.text)
            for chunk in doc.chunks
        ]

        vectors = self.model.encode(
            texts,
            batch_size=self.batch_size,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        embedded_chunks = [
            EmbeddedChunk(
                chunk_id=chunk.chunk_id,
                segment_index=chunk.segment_index,
                text=chunk.text,
                embedding=vector.tolist(),
            )
            for chunk, vector in zip(doc.chunks, vectors)
        ]

        return EmbeddedDocument(
            metadata=doc.metadata,
            embedded_chunks=embedded_chunks,
        )


def embed_document(
    doc: ProcessedDocument,
    embedder: DocumentEmbedder | None = None,
) -> EmbeddedDocument:
    """
    Entry point untuk penggunaan sederhana.

    Untuk batch processing, disarankan membuat satu instance
    DocumentEmbedder dan memakainya berulang kali agar model tidak
    di-load ulang.
    """

    if embedder is None:
        embedder = DocumentEmbedder()

    return embedder.embed(doc)


if __name__ == "__main__":
    print(
        "Embedder adalah bagian dari embedding pipeline.\n"
        "Jalankan melalui pipeline embedding untuk pengujian."
    )