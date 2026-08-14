"""
indexing.py

Service untuk melakukan indexing dokumen:
file -> preprocessing -> embedding -> ChromaDB -> update status PostgreSQL.
"""

from __future__ import annotations

import logging
from pathlib import Path

from sqlalchemy.orm import Session

from app.models import Document, DocumentStatus
from app.services.embedding.embedder import DocumentEmbedder
from app.services.preprocessing.pipeline import preprocess_document
from app.services.vectorstore.store import VectorStore

logger = logging.getLogger(__name__)


class DocumentIndexingError(RuntimeError):
    """Dilempar ketika proses indexing dokumen gagal."""


def _mark_failed(
    document_id: int,
    db: Session,
) -> None:
    """
    Mengubah status dokumen menjadi FAILED.

    Fungsi ini dipanggil setelah rollback agar perubahan status
    tidak ikut hilang bersama transaksi yang gagal.
    """

    try:
        db.rollback()

        document = db.get(Document, document_id)

        if document is None:
            logger.error(
                "Tidak dapat mengubah status FAILED. "
                "Document id=%s tidak ditemukan.",
                document_id,
            )
            return

        document.status = DocumentStatus.FAILED
        db.commit()

    except Exception:
        db.rollback()

        logger.exception(
            "Gagal mengubah status document_id=%s menjadi FAILED.",
            document_id,
        )


def index_document(
    document: Document,
    db: Session,
    embedder: DocumentEmbedder,
    vector_store: VectorStore,
) -> None:
    """
    Melakukan indexing satu dokumen ke vector store.

    Alur:

        PostgreSQL Document
              ↓
        Validasi file
              ↓
        PROCESSING
              ↓
        Preprocessing
              ↓
        Embedding
              ↓
        ChromaDB
              ↓
        COMPLETED

    Jika salah satu tahap gagal:

        → FAILED

    Parameter
    ---------
    document:
        Object Document dari PostgreSQL.

    db:
        SQLAlchemy Session.

    embedder:
        Singleton DocumentEmbedder.

    vector_store:
        Singleton VectorStore.

    Raises
    ------
    DocumentIndexingError
        Jika proses indexing gagal.
    """

    document_id = document.id
    chroma_document_id = str(document_id)
    file_path = Path(document.file_path)

    logger.info(
        "Mulai indexing document_id=%s, file=%s",
        document_id,
        file_path,
    )

    # =========================================================
    # 1. VALIDASI FILE
    # =========================================================

    if not file_path.exists():
        error_message = (
            f"File dokumen tidak ditemukan: {file_path}"
        )

        logger.error(
            "Indexing gagal document_id=%s: %s",
            document_id,
            error_message,
        )

        _mark_failed(document_id, db)

        raise DocumentIndexingError(error_message)

    if not file_path.is_file():
        error_message = (
            f"Path dokumen bukan file: {file_path}"
        )

        logger.error(
            "Indexing gagal document_id=%s: %s",
            document_id,
            error_message,
        )

        _mark_failed(document_id, db)

        raise DocumentIndexingError(error_message)

    # =========================================================
    # 2. STATUS → PROCESSING
    # =========================================================

    try:
        document.status = DocumentStatus.PROCESSING
        db.commit()

        logger.info(
            "Status document_id=%s → PROCESSING",
            document_id,
        )

    except Exception as exc:
        db.rollback()

        logger.exception(
            "Gagal mengubah status document_id=%s menjadi PROCESSING.",
            document_id,
        )

        raise DocumentIndexingError(
            f"Gagal mengubah status dokumen menjadi PROCESSING: {exc}"
        ) from exc

    # =========================================================
    # 3. PREPROCESSING
    # =========================================================

    try:
        processed_document = preprocess_document(
            filepath=str(file_path),
            document_id=chroma_document_id,
        )

        if not processed_document.success:
            raise DocumentIndexingError(
                "Preprocessing gagal: "
                f"{processed_document.error}"
            )

        logger.info(
            "Preprocessing berhasil: "
            "document_id=%s, segments=%d, chunks=%d",
            document_id,
            processed_document.num_segments,
            processed_document.num_chunks,
        )

    except Exception as exc:
        _mark_failed(document_id, db)

        if isinstance(exc, DocumentIndexingError):
            raise

        raise DocumentIndexingError(
            f"Gagal melakukan preprocessing dokumen: {exc}"
        ) from exc

    # =========================================================
    # 4. EMBEDDING
    # =========================================================

    try:
        embedded_document = embedder.embed(
            processed_document
        )

        if not embedded_document.success:
            raise DocumentIndexingError(
                "Embedding gagal: "
                f"{embedded_document.error}"
            )

        logger.info(
            "Embedding berhasil: "
            "document_id=%s, chunks=%d",
            document_id,
            len(embedded_document.embedded_chunks),
        )

    except Exception as exc:
        _mark_failed(document_id, db)

        if isinstance(exc, DocumentIndexingError):
            raise

        raise DocumentIndexingError(
            f"Gagal melakukan embedding dokumen: {exc}"
        ) from exc

    # =========================================================
    # 5. SIMPAN KE CHROMADB
    # =========================================================

    try:
        stored_document = vector_store.add_document(
            embedded_document
        )

        if not stored_document.success:
            raise DocumentIndexingError(
                "Vector store gagal: "
                f"{stored_document.error}"
            )

        logger.info(
            "Vector store berhasil: "
            "document_id=%s, chunks=%d",
            document_id,
            stored_document.num_chunks,
        )

    except Exception as exc:
        _mark_failed(document_id, db)

        if isinstance(exc, DocumentIndexingError):
            raise

        raise DocumentIndexingError(
            f"Gagal menyimpan dokumen ke vector store: {exc}"
        ) from exc

    # =========================================================
    # 6. STATUS → COMPLETED
    # =========================================================

    try:
        document = db.get(Document, document_id)

        if document is None:
            raise DocumentIndexingError(
                f"Dokumen dengan id={document_id} "
                "tidak ditemukan saat menyelesaikan indexing."
            )

        document.status = DocumentStatus.COMPLETED
        db.commit()

        logger.info(
            "Indexing selesai: "
            "document_id=%s, status=COMPLETED, chunks=%d",
            document_id,
            stored_document.num_chunks,
        )

    except Exception as exc:
        db.rollback()

        logger.exception(
            "Gagal mengubah status document_id=%s menjadi COMPLETED.",
            document_id,
        )

        # Jangan mencoba memproses ulang indexing di sini.
        # Jika ChromaDB sudah berhasil menyimpan data, dokumen
        # kemungkinan sudah ter-index meskipun status PostgreSQL
        # gagal diperbarui.
        raise DocumentIndexingError(
            f"Indexing berhasil tetapi gagal memperbarui "
            f"status dokumen: {exc}"
        ) from exc

