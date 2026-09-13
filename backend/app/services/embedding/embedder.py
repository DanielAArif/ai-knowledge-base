"""
embedder.py

Tahap embedding pipeline menggunakan FastEmbed.

Tanggung jawab modul ini:
- Memuat embedding model menggunakan FastEmbed.
- Mengubah DocumentChunk menjadi EmbeddedChunk.
- Menghasilkan embedding untuk user query.
- Menghasilkan EmbeddedDocument.

Modul ini TIDAK bertugas:
- Menyimpan embedding ke ChromaDB.
- Melakukan similarity search.
- Berinteraksi dengan LLM.

Catatan:
Model default:
    sentence-transformers/all-MiniLM-L6-v2

Model ini tidak membutuhkan prefix "passage:" atau "query:".

Untuk model E5:
    document -> "passage: ..."
    query    -> "query: ..."
"""

from __future__ import annotations

from fastembed import TextEmbedding

from ..preprocessing.models import ProcessedDocument
from .models import EmbeddedChunk, EmbeddedDocument


DEFAULT_MODEL = "intfloat/multilingual-e5-large"

_E5_PASSAGE_PREFIX = "passage: "
_E5_QUERY_PREFIX = "query: "


class DocumentEmbedder:
    """
    Embedder berbasis FastEmbed.

    Instance sebaiknya dibuat sekali dan digunakan kembali
    agar model tidak perlu dimuat ulang.
    """

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL,
        batch_size: int = 32,
    ):
        self.model_name = model_name
        self.batch_size = batch_size

        self.model = TextEmbedding(
            model_name=model_name,
            cache_dir="/tmp/fastembed_cache",
        )

    def _is_e5_model(self) -> bool:
        """
        Mengecek apakah model yang digunakan merupakan model E5.
        """

        return "e5" in self.model_name.lower()

    def _prepare_text(self, text: str) -> str:
        """
        Menyiapkan teks dokumen sebelum embedding.

        Model E5 membutuhkan prefix:
            passage: <text>

        Model lain dikembalikan apa adanya.
        """

        if self._is_e5_model():
            return f"{_E5_PASSAGE_PREFIX}{text}"

        return text

    def _prepare_query(self, query: str) -> str:
        """
        Menyiapkan query sebelum embedding.

        Model E5 membutuhkan prefix:
            query: <query>

        Model lain dikembalikan apa adanya.
        """

        if self._is_e5_model():
            return f"{_E5_QUERY_PREFIX}{query}"

        return query

    def embed(
        self,
        doc: ProcessedDocument,
    ) -> EmbeddedDocument:
        """
        Mengubah seluruh DocumentChunk menjadi EmbeddedChunk.

        Alur:

            ProcessedDocument
                    ↓
                DocumentChunk
                    ↓
                FastEmbed
                    ↓
                EmbeddedChunk
                    ↓
                EmbeddedDocument
        """

        # ----------------------------------------------------------
        # 1. Validasi preprocessing
        # ----------------------------------------------------------

        if not doc.success:
            return EmbeddedDocument(
                document_id=doc.document_id,
                metadata=doc.metadata,
                error=doc.error,
            )

        # ----------------------------------------------------------
        # 2. Pastikan terdapat chunks
        # ----------------------------------------------------------

        if not doc.chunks:
            return EmbeddedDocument(
                document_id=doc.document_id,
                metadata=doc.metadata,
                error="ProcessedDocument contains no chunks.",
            )

        # ----------------------------------------------------------
        # 3. Siapkan teks
        # ----------------------------------------------------------

        texts = [
            self._prepare_text(chunk.text)
            for chunk in doc.chunks
        ]

        # ----------------------------------------------------------
        # 4. Generate embedding secara batch
        # ----------------------------------------------------------

        vectors_generator = self.model.embed(
            texts,
            batch_size=self.batch_size,
        )

        # ----------------------------------------------------------
        # 5. Gabungkan chunk dengan embedding
        # ----------------------------------------------------------

        embedded_chunks = [
            EmbeddedChunk(
                chunk_id=chunk.chunk_id,
                segment_index=chunk.segment_index,
                text=chunk.text,
                embedding=vector.tolist(),
            )
            for chunk, vector in zip(
                doc.chunks,
                vectors_generator,
            )
        ]

        # ----------------------------------------------------------
        # 6. Return EmbeddedDocument
        # ----------------------------------------------------------

        return EmbeddedDocument(
            document_id=doc.document_id,
            metadata=doc.metadata,
            embedded_chunks=embedded_chunks,
        )

    def embed_query(
        self,
        query: str,
    ) -> list[float]:
        """
        Mengubah user query menjadi embedding vector.

        Contoh:

            query = "Apa saja fitur AI Knowledge Base?"

        Return:

            list[float]

        Embedding yang dihasilkan nantinya digunakan oleh
        VectorStore untuk melakukan similarity search.
        """

        # ----------------------------------------------------------
        # 1. Validasi query
        # ----------------------------------------------------------

        if not query or not query.strip():
            raise ValueError(
                "Query tidak boleh kosong."
            )

        # ----------------------------------------------------------
        # 2. Siapkan query
        # ----------------------------------------------------------

        prepared_query = self._prepare_query(
            query.strip()
        )

        # ----------------------------------------------------------
        # 3. Generate query embedding
        # ----------------------------------------------------------

        vectors_generator = self.model.embed(
            [prepared_query],
        )

        # ----------------------------------------------------------
        # 4. Ambil vector pertama
        # ----------------------------------------------------------

        vector = next(iter(vectors_generator))

        # ----------------------------------------------------------
        # 5. Konversi numpy array → list[float]
        # ----------------------------------------------------------

        return vector.tolist()


def embed_document(
    doc: ProcessedDocument,
    embedder: DocumentEmbedder | None = None,
) -> EmbeddedDocument:
    """
    Entry point sederhana untuk embedding dokumen.

    Jika embedder tidak diberikan, instance baru akan dibuat.

    Untuk batch processing, sebaiknya gunakan satu instance
    DocumentEmbedder agar model tidak dimuat ulang.
    """

    if embedder is None:
        embedder = DocumentEmbedder()

    return embedder.embed(doc)


if __name__ == "__main__":
    print(
        "Embedder adalah bagian dari embedding pipeline.\n"
        "Gunakan DocumentEmbedder.embed() untuk dokumen atau\n"
        "DocumentEmbedder.embed_query() untuk query."
    )