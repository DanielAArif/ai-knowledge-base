"""
indexing.py

Service untuk melakukan indexing dokumen:
file -> preprocessing -> embedding -> ChromaDB -> update status PostgreSQL.

Proses indexing dipanggil oleh background task sehingga tidak
memblokir request upload.

Selain memperbarui status PostgreSQL, service ini juga mengirimkan
event progress melalui Redis Pub/Sub agar dapat diteruskan ke
client melalui WebSocket.
"""

from __future__ import annotations

import logging
from pathlib import Path

from sqlalchemy.orm import Session

from app.models import Document, DocumentStatus, ChatSession
from app.services.embedding.embedder import DocumentEmbedder
from app.services.preprocessing.pipeline import preprocess_document
from app.services.vectorstore.store import VectorStore
from app.services.websocket.publisher import publish_document_status


logger = logging.getLogger(__name__)


class DocumentIndexingError(RuntimeError):
    """Dilempar ketika proses indexing dokumen gagal."""


# ============================================================
# PUBLISH STATUS
# ============================================================

def _publish_status(
    document_id: int,
    status: str,
    message: str,
    progress: int | None = None,
) -> None:
    """
    Mengirim event status indexing ke Redis.

    Kegagalan publish event tidak boleh menghentikan proses
    indexing utama.
    """

    try:
        publish_document_status(
            document_id=document_id,
            status=status,
            message=message,
            progress=progress,
        )

    except Exception:
        logger.exception(
            "[Indexing] Gagal mengirim status WebSocket "
            "document_id=%s, status=%s.",
            document_id,
            status,
        )


# ============================================================
# MARK DOCUMENT AS FAILED
# ============================================================

def _mark_failed(
    document_id: int,
    db: Session,
    error_message: str | None = None,
) -> None:
    """
    Mengubah status dokumen menjadi FAILED.

    Fungsi ini menggunakan database session yang sama dengan
    proses indexing karena proses indexing dijalankan sebagai
    background task dengan session tersendiri.

    Selain mengubah status PostgreSQL, fungsi ini juga mengirim
    event FAILED melalui Redis/WebSocket.
    """

    try:
        # Pastikan transaksi sebelumnya dibatalkan terlebih dahulu.
        db.rollback()

        document = db.get(
            Document,
            document_id,
        )

        if document is None:
            logger.error(
                "[Indexing] Tidak dapat mengubah status FAILED. "
                "Document id=%s tidak ditemukan.",
                document_id,
            )
            return

        document.status = DocumentStatus.FAILED

        db.commit()

        logger.info(
            "[Indexing] Status document_id=%s → FAILED",
            document_id,
        )

    except Exception:
        db.rollback()

        logger.exception(
            "[Indexing] Gagal mengubah status "
            "document_id=%s menjadi FAILED.",
            document_id,
        )

    finally:
        # Event WebSocket tetap dikirim setelah proses status
        # database ditangani.
        message = (
            error_message
            if error_message
            else "Document indexing failed."
        )

        _publish_status(
            document_id=document_id,
            status="failed",
            message=message,
            progress=None,
        )


# ============================================================
# INDEX DOCUMENT
# ============================================================

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

    Event WebSocket:

        processing
              ↓
        preprocessing
              ↓
        embedding
              ↓
        storing
              ↓
        completed

    Jika salah satu tahap gagal:

        → failed

    Parameter
    ---------
    document:
        Object Document dari PostgreSQL.

    db:
        SQLAlchemy Session khusus untuk background task.

    embedder:
        Singleton DocumentEmbedder.

    vector_store:
        Singleton VectorStore.

    Raises
    ------
    DocumentIndexingError
        Jika proses indexing gagal.
    """

    document_id = int(document.id)

    chroma_document_id = str(
        document_id
    )

    file_path = Path(
        document.file_path
    )

    logger.info(
        "[Indexing] Mulai indexing "
        "document_id=%s, file=%s",
        document_id,
        file_path,
    )

    # =========================================================
    # 1. STATUS → PROCESSING
    # =========================================================

    _publish_status(
        document_id=document_id,
        status="processing",
        message="Starting document indexing...",
        progress=None,
    )

    # =========================================================
    # 2. VALIDASI FILE
    # =========================================================

    if not file_path.exists():
        error_message = (
            f"File dokumen tidak ditemukan: {file_path}"
        )

        logger.error(
            "[Indexing] Gagal document_id=%s: %s",
            document_id,
            error_message,
        )

        _mark_failed(
            document_id,
            db,
            error_message,
        )

        raise DocumentIndexingError(
            error_message
        )

    if not file_path.is_file():
        error_message = (
            f"Path dokumen bukan file: {file_path}"
        )

        logger.error(
            "[Indexing] Gagal document_id=%s: %s",
            document_id,
            error_message,
        )

        _mark_failed(
            document_id,
            db,
            error_message,
        )

        raise DocumentIndexingError(
            error_message
        )

    # =========================================================
    # 3. STATUS DATABASE → PROCESSING
    # =========================================================

    try:
        document.status = (
            DocumentStatus.PROCESSING
        )

        db.commit()

        logger.info(
            "[Indexing] Status document_id=%s → PROCESSING",
            document_id,
        )

    except Exception as exc:
        db.rollback()

        error_message = (
            "Gagal mengubah status dokumen "
            f"menjadi PROCESSING: {exc}"
        )

        logger.exception(
            "[Indexing] %s",
            error_message,
        )

        _publish_status(
            document_id=document_id,
            status="failed",
            message=error_message,
            progress=None,
        )

        raise DocumentIndexingError(
            error_message
        ) from exc

    # =========================================================
    # 4. PREPROCESSING
    # =========================================================

    _publish_status(
        document_id=document_id,
        status="preprocessing",
        message="Processing document...",
        progress=None,
    )

    try:
        logger.info(
            "[Indexing] Preprocessing dimulai "
            "document_id=%s",
            document_id,
        )

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
            "[Indexing] Preprocessing berhasil "
            "document_id=%s, segments=%d, chunks=%d",
            document_id,
            processed_document.num_segments,
            processed_document.num_chunks,
        )

    except Exception as exc:
        if isinstance(
            exc,
            DocumentIndexingError,
        ):
            error_message = str(exc)
        else:
            error_message = (
                "Gagal melakukan preprocessing "
                f"dokumen: {exc}"
            )

        _mark_failed(
            document_id,
            db,
            error_message,
        )

        if isinstance(
            exc,
            DocumentIndexingError,
        ):
            raise

        raise DocumentIndexingError(
            error_message
        ) from exc

    # =========================================================
    # 5. EMBEDDING
    # =========================================================

    _publish_status(
        document_id=document_id,
        status="embedding",
        message="Generating embeddings...",
        progress=None,
    )

    try:
        logger.info(
            "[Indexing] Embedding dimulai "
            "document_id=%s, chunks=%d",
            document_id,
            processed_document.num_chunks,
        )

        embedded_document = embedder.embed(
            processed_document
        )

        if not embedded_document.success:
            raise DocumentIndexingError(
                "Embedding gagal: "
                f"{embedded_document.error}"
            )

        logger.info(
            "[Indexing] Embedding berhasil "
            "document_id=%s, chunks=%d",
            document_id,
            len(
                embedded_document.embedded_chunks
            ),
        )

    except Exception as exc:
        if isinstance(
            exc,
            DocumentIndexingError,
        ):
            error_message = str(exc)
        else:
            error_message = (
                "Gagal melakukan embedding "
                f"dokumen: {exc}"
            )

        _mark_failed(
            document_id,
            db,
            error_message,
        )

        if isinstance(
            exc,
            DocumentIndexingError,
        ):
            raise

        raise DocumentIndexingError(
            error_message
        ) from exc

    # =========================================================
    # 6. SIMPAN KE CHROMADB
    # =========================================================

    _publish_status(
        document_id=document_id,
        status="storing",
        message="Storing document vectors...",
        progress=None,
    )

    try:
        logger.info(
            "[Indexing] Menyimpan ke ChromaDB "
            "document_id=%s",
            document_id,
        )

        stored_document = (
            vector_store.add_document(
                embedded_document
            )
        )

        if not stored_document.success:
            raise DocumentIndexingError(
                "Vector store gagal: "
                f"{stored_document.error}"
            )

        logger.info(
            "[Indexing] ChromaDB berhasil "
            "document_id=%s, chunks=%d",
            document_id,
            stored_document.num_chunks,
        )

    except Exception as exc:
        if isinstance(
            exc,
            DocumentIndexingError,
        ):
            error_message = str(exc)
        else:
            error_message = (
                "Gagal menyimpan dokumen ke "
                f"vector store: {exc}"
            )

        _mark_failed(
            document_id,
            db,
            error_message,
        )

        if isinstance(
            exc,
            DocumentIndexingError,
        ):
            raise

        raise DocumentIndexingError(
            error_message
        ) from exc

        # =========================================================
    # 7. STATUS → COMPLETED
    # =========================================================

    try:
        document = db.get(
            Document,
            document_id,
        )

        if document is None:
            raise DocumentIndexingError(
                f"Dokumen dengan id={document_id} "
                "tidak ditemukan saat menyelesaikan indexing."
            )

        document.status = (
            DocumentStatus.COMPLETED
        )

        db.commit()

        logger.info(
            "[Indexing] Indexing selesai "
            "document_id=%s, "
            "status=COMPLETED, "
            "chunks=%d",
            document_id,
            stored_document.num_chunks,
        )

    except Exception as exc:
        db.rollback()

        error_message = (
            "Indexing berhasil tetapi gagal "
            "memperbarui status dokumen: "
            f"{exc}"
        )

        logger.exception(
            "[Indexing] Gagal mengubah status "
            "document_id=%s menjadi COMPLETED.",
            document_id,
        )

        _publish_status(
            document_id=document_id,
            status="failed",
            message=error_message,
            progress=None,
        )

        # Jangan mencoba mengulang indexing.
        #
        # Jika ChromaDB sudah berhasil menyimpan embedding,
        # data kemungkinan sudah ter-index meskipun status
        # PostgreSQL gagal diperbarui.

        raise DocumentIndexingError(
            error_message
        ) from exc

    # =========================================================
    # 8. CREATE DOCUMENT CHAT SESSION
    # =========================================================

    try:
        existing_session = (
            db.query(ChatSession)
            .filter(
                ChatSession.user_id == document.user_id,
                ChatSession.document_id == document.id,
            )
            .first()
        )

        if not existing_session:
            chat_session = ChatSession(
                title=(
                    f"Chat: "
                    f"{document.title or document.filename}"
                ),
                user_id=document.user_id,
                document_id=document.id,
            )

            db.add(chat_session)
            db.commit()

            logger.info(
                "[Indexing] Document chat session dibuat "
                "document_id=%s, user_id=%s",
                document.id,
                document.user_id,
            )
        else:
            logger.info(
                "[Indexing] Document chat session sudah ada "
                "document_id=%s, session_id=%s",
                document.id,
                existing_session.id,
            )

    except Exception as exc:
        db.rollback()

        error_message = (
            "Indexing berhasil tetapi gagal "
            "membuat document chat session: "
            f"{exc}"
        )

        logger.exception(
            "[Indexing] Gagal membuat ChatSession "
            "document_id=%s.",
            document_id,
        )

        _publish_status(
            document_id=document_id,
            status="failed",
            message=error_message,
            progress=None,
        )

        raise DocumentIndexingError(
            error_message
        ) from exc

    # =========================================================
    # 9. PUBLISH COMPLETED
    # =========================================================

    _publish_status(
        document_id=document_id,
        status="completed",
        message="Document indexing completed.",
        progress=100,
    )