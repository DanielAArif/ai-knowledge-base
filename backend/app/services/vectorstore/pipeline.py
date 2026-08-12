"""
pipeline.py
Pipeline penyimpanan embedding ke vector store.

Alur:
    EmbeddedDocument
            ↓
    vectorstore_pipeline()
            ↓
    VectorStore
            ↓
        ChromaDB
"""

from __future__ import annotations

from app.services.embedding.models import EmbeddedDocument

from .client import ChromaConnectionError, get_chroma_client
from .models import StoredDocument
from .store import DEFAULT_COLLECTION, VectorStore


def vectorstore_pipeline(
    document: EmbeddedDocument,
    collection_name: str = DEFAULT_COLLECTION,
) -> StoredDocument:
    """
    Menyimpan EmbeddedDocument ke ChromaDB.

    Kegagalan koneksi/inisialisasi ditangkap dan dikembalikan
    sebagai StoredDocument(error=...), konsisten dengan kontrak
    error pada pipeline sebelumnya.
    """

    document_id = str(document.document_id)

    # Precondition check, bukan defensive validation.
    # Tujuannya mencegah pemanggilan ChromaDB yang sudah pasti sia-sia
    # kalau embedding sebelumnya sudah gagal atau kosong.
    #
    # VectorStore.add_document() melakukan pengecekan yang sama persis
    # sebagai defensive validation-nya sendiri. Duplikasi ini disengaja:
    # pipeline.py menjaga efisiensi (hindari network call percuma),
    # store.py menjaga validitasnya sendiri (tetap aman dipanggil
    # langsung tanpa melalui pipeline ini). Jangan disatukan/di-refactor
    # tanpa mempertimbangkan kedua tujuan ini.
    if not document.success:
        return StoredDocument(
            document_id=document_id,
            collection_name=collection_name,
            error=document.error,
        )

    if not document.embedded_chunks:
        return StoredDocument(
            document_id=document_id,
            collection_name=collection_name,
            error="Dokumen tidak memiliki embedded chunks.",
        )

    try:
        client = get_chroma_client()
        store = VectorStore(
            client=client,
            collection_name=collection_name,
        )
    except (ChromaConnectionError, ValueError) as exc:
        return StoredDocument(
            document_id=document_id,
            collection_name=collection_name,
            error=f"Gagal menyiapkan vector store: {exc}",
        )

    return store.add_document(document)