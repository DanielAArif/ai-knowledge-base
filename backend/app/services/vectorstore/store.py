"""
store.py
Implementasi vector store menggunakan ChromaDB.
"""

from __future__ import annotations

import logging
from typing import Any

from chromadb.api import ClientAPI

from app.services.embedding.models import EmbeddedDocument

from .models import SearchResult, SearchResults, StoredDocument


logger = logging.getLogger(__name__)

DEFAULT_COLLECTION = "knowledge_base"


class VectorStore:
    """
    Abstraksi vector store berbasis ChromaDB.

    Satu instance VectorStore menggunakan satu collection.
    """

    def __init__(
        self,
        client: ClientAPI,
        collection_name: str = DEFAULT_COLLECTION,
    ):
        if not collection_name.strip():
            raise ValueError(
                "collection_name tidak boleh kosong."
            )

        self.client = client
        self.collection_name = collection_name

        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
        )

        logger.info(
            "VectorStore menggunakan collection '%s'.",
            self.collection_name,
        )

    @staticmethod
    def _build_chunk_id(
        document_id: str,
        chunk_id: int | str,
    ) -> str:
        """
        Membuat ID unik untuk chunk di dalam ChromaDB.

        Format:
            document_id:chunk_id

        Contoh:
            document-123:1
            document-123:2
            document-456:1
        """

        return f"{document_id}:{chunk_id}"

    def add_document(
        self,
        document: EmbeddedDocument,
    ) -> StoredDocument:
        """
        Menyimpan seluruh embedding dari satu EmbeddedDocument.

        Menggunakan upsert sehingga:
        - chunk baru akan ditambahkan
        - chunk dengan ID yang sama akan diperbarui

        Parameters
        ----------
        document:
            EmbeddedDocument hasil dari embedding pipeline.

        Returns
        -------
        StoredDocument
            Informasi hasil penyimpanan.
        """

        document_id = str(document.document_id)

        # Jangan menyimpan dokumen yang embedding pipeline-nya gagal.
        if not document.success:
            return StoredDocument(
                document_id=document_id,
                collection_name=self.collection_name,
                error=document.error,
            )

        # Dokumen berhasil diproses tetapi tidak mempunyai embedding.
        if not document.embedded_chunks:
            return StoredDocument(
                document_id=document_id,
                collection_name=self.collection_name,
                error="Dokumen tidak memiliki embedded chunks.",
            )

        ids: list[str] = []
        embeddings: list[list[float]] = []
        documents: list[str] = []
        metadatas: list[dict[str, Any]] = []

        for chunk in document.embedded_chunks:
            chroma_chunk_id = self._build_chunk_id(
                document_id=document_id,
                chunk_id=chunk.chunk_id,
            )

            ids.append(chroma_chunk_id)
            embeddings.append(chunk.embedding)
            documents.append(chunk.text)

            metadatas.append(
                {
                    "document_id": document_id,
                    "chunk_id": str(chunk.chunk_id),
                    "segment_index": chunk.segment_index,
                }
            )

        try:
            self.collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
            )

            logger.info(
                "Berhasil menyimpan %d chunks "
                "untuk document '%s' ke collection '%s'.",
                len(ids),
                document_id,
                self.collection_name,
            )

            return StoredDocument(
                document_id=document_id,
                collection_name=self.collection_name,
                chunk_ids=ids,
            )

        except Exception as exc:
            logger.error(
                "Gagal menyimpan embedding untuk document '%s': %s",
                document_id,
                exc,
            )

            return StoredDocument(
                document_id=document_id,
                collection_name=self.collection_name,
                error=f"Gagal menyimpan embedding: {exc}",
            )

    def search(
        self,
        query_embedding: list[float],
        n_results: int = 5,
        document_id: str | int | None = None,
    ) -> SearchResults:
        """
        Melakukan similarity search menggunakan embedding query.

        Parameters
        ----------
        query_embedding:
            Vector embedding dari query.

        n_results:
            Jumlah hasil maksimum yang diminta.

        Returns
        -------
        SearchResults
            Hasil similarity search.
        """

        if not query_embedding:
            return SearchResults(
                error="Query embedding tidak boleh kosong.",
            )

        if n_results <= 0:
            return SearchResults(
                error="n_results harus lebih besar dari 0.",
            )

        try:
            # Buat filter metadata jika document_id diberikan
            where_filter = None
            if document_id is not None and str(document_id).strip():
                where_filter = {"document_id": str(document_id)}

            result = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_filter,  # Filter ChromaDB berdasarkan metadata document_id
                include=[
                    "documents",
                    "metadatas",
                    "distances",
                ],
            )

            ids = result.get("ids", [[]])[0]
            documents = result.get("documents", [[]])[0]
            metadatas = result.get("metadatas", [[]])[0]
            distances = result.get("distances", [[]])[0]

            results: list[SearchResult] = []

            for chunk_id, text, metadata, distance in zip(
                ids,
                documents,
                metadatas,
                distances,
            ):
                metadata = metadata or {}

                results.append(
                    SearchResult(
                        chunk_id=str(
                            metadata.get(
                                "chunk_id",
                                chunk_id,
                            )
                        ),
                        document_id=str(
                            metadata.get(
                                "document_id",
                                "",
                            )
                        ),
                        text=text or "",
                        distance=float(distance),
                        metadata=metadata,
                    )
                )

            logger.info(
                "Similarity search berhasil: "
                "%d hasil dari collection '%s'.",
                len(results),
                self.collection_name,
            )

            return SearchResults(
                results=results,
            )

        except Exception as exc:
            logger.error(
                "Gagal melakukan similarity search "
                "pada collection '%s': %s",
                self.collection_name,
                exc,
            )

            return SearchResults(
                error=f"Gagal melakukan similarity search: {exc}",
            )

    def delete_chunks(
        self,
        chunk_ids: list[str],
    ) -> bool:
        """
        Menghapus chunk berdasarkan ID ChromaDB.

        Operasi bersifat idempotent:
        jika ID tidak ditemukan, ChromaDB tidak dianggap error.
        """

        if not chunk_ids:
            return True

        try:
            self.collection.delete(
                ids=chunk_ids,
            )

            logger.info(
                "Berhasil menghapus %d chunks "
                "dari collection '%s'.",
                len(chunk_ids),
                self.collection_name,
            )

            return True

        except Exception as exc:
            logger.warning(
                "Gagal menghapus %d chunks "
                "dari collection '%s': %s",
                len(chunk_ids),
                self.collection_name,
                exc,
            )

            return False

    def delete_document(
        self,
        document_id: str,
    ) -> bool:
        """
        Menghapus seluruh embedding milik satu dokumen.

        Penghapusan dilakukan berdasarkan metadata:
            document_id

        Operasi bersifat idempotent:
        jika document_id tidak ditemukan, operasi tetap dianggap
        berhasil selama ChromaDB tidak mengembalikan error.
        """

        if not document_id.strip():
            logger.warning(
                "delete_document dipanggil dengan document_id kosong."
            )
            return False

        try:
            self.collection.delete(
                where={
                    "document_id": str(document_id),
                }
            )

            logger.info(
                "Berhasil menghapus embedding "
                "untuk document '%s' dari collection '%s'.",
                document_id,
                self.collection_name,
            )

            return True

        except Exception as exc:
            logger.warning(
                "Gagal menghapus document '%s' "
                "dari collection '%s': %s",
                document_id,
                self.collection_name,
                exc,
            )

            return False