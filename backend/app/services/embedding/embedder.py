"""
embedder.py
Tahap pertama embedding pipeline.

Tanggung jawab modul ini:

- Memuat embedding model menggunakan FastEmbed (ONNX Runtime, tanpa PyTorch).
- Mengubah seluruh DocumentChunk sebuah dokumen menjadi EmbeddedChunk
  lewat satu pemanggilan batch.
- Menghasilkan EmbeddedDocument.
- Meneruskan document_id dari preprocessing ke embedding.

Modul ini TIDAK bertugas:

- Menyimpan ke ChromaDB.
- Melakukan similarity search.
- Berinteraksi dengan LLM.

Catatan penting soal model E5 (intfloat/multilingual-e5-*):
Model ini menggunakan konvensi prefix:
- "passage: " untuk dokumen.
- "query: " untuk query pencarian.

Prefix hanya diterapkan otomatis jika model yang digunakan adalah
keluarga E5.

Dependencies:
pip install fastembed
"""

from __future__ import annotations

from fastembed import TextEmbedding

from ..preprocessing.models import ProcessedDocument
from .models import EmbeddedChunk, EmbeddedDocument


DEFAULT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

_E5_PASSAGE_PREFIX = "passage: "


class DocumentEmbedder:
    """
    Embedder berbasis FastEmbed (ONNX Runtime).

    Instance sebaiknya dibuat sekali, misalnya saat startup FastAPI,
    lalu digunakan berulang kali agar model tidak di-load ulang.
    """

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL,
        batch_size: int = 32,
    ):
        self.model_name = model_name
        self.batch_size = batch_size

        # FastEmbed menggunakan ONNX Runtime sehingga tidak
        # membutuhkan PyTorch.
        self.model = TextEmbedding(
            model_name=model_name,
        )

    def _prepare_text(self, text: str) -> str:
        """
        Menyesuaikan format teks berdasarkan embedding model.

        Model keluarga E5 membutuhkan prefix "passage:" untuk
        teks dokumen.

        Model lain dikembalikan tanpa perubahan.
        """

        if "e5" in self.model_name.lower():
            return f"{_E5_PASSAGE_PREFIX}{text}"

        return text

    def embed(
        self,
        doc: ProcessedDocument,
    ) -> EmbeddedDocument:
        """
        Mengubah seluruh DocumentChunk menjadi EmbeddedChunk.

        Seluruh chunk diproses dalam satu batch.
        """

        # ---------------------------------------------------------
        # Preprocessing gagal
        # ---------------------------------------------------------

        if not doc.success:
            return EmbeddedDocument(
                document_id=doc.document_id,
                metadata=doc.metadata,
                error=doc.error,
            )

        # ---------------------------------------------------------
        # Tidak ada chunk
        # ---------------------------------------------------------

        if not doc.chunks:
            return EmbeddedDocument(
                document_id=doc.document_id,
                metadata=doc.metadata,
                error="ProcessedDocument contains no chunks.",
            )

        # ---------------------------------------------------------
        # Prepare texts
        # ---------------------------------------------------------

        texts = [
            self._prepare_text(chunk.text)
            for chunk in doc.chunks
        ]

        # ---------------------------------------------------------
        # Generate embeddings
        # ---------------------------------------------------------

        try:
            vectors_generator = self.model.embed(
                texts,
                batch_size=self.batch_size,
            )

            # FastEmbed mengembalikan generator berisi numpy arrays.
            vectors = list(vectors_generator)

        except Exception as exc:
            return EmbeddedDocument(
                document_id=doc.document_id,
                metadata=doc.metadata,
                error=f"Gagal membuat embedding: {exc}",
            )

        # ---------------------------------------------------------
        # Validate result
        # ---------------------------------------------------------

        if len(vectors) != len(doc.chunks):
            return EmbeddedDocument(
                document_id=doc.document_id,
                metadata=doc.metadata,
                error=(
                    "Jumlah embedding tidak sesuai dengan jumlah chunk."
                ),
            )

        # ---------------------------------------------------------
        # Build EmbeddedChunk
        # ---------------------------------------------------------

        embedded_chunks = [
            EmbeddedChunk(
                chunk_id=chunk.chunk_id,
                segment_index=chunk.segment_index,
                text=chunk.text,
                embedding=vector.tolist(),
            )
            for chunk, vector in zip(
                doc.chunks,
                vectors,
            )
        ]

        # ---------------------------------------------------------
        # Return EmbeddedDocument
        # ---------------------------------------------------------

        return EmbeddedDocument(
            document_id=doc.document_id,
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
    DocumentEmbedder dan menggunakannya berulang kali agar model
    tidak di-load ulang.
    """

    if embedder is None:
        embedder = DocumentEmbedder()

    return embedder.embed(doc)


if __name__ == "__main__":
    print(
        "Embedder adalah bagian dari embedding pipeline.\n"
        "Jalankan melalui pipeline embedding untuk pengujian."
    )