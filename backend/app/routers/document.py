"""
routers/document.py

Endpoint untuk upload dan manajemen dokumen.

Alur upload:

    Upload file
        ↓
    Validasi file
        ↓
    Simpan file fisik
        ↓
    Simpan metadata ke PostgreSQL
        ↓
    Indexing
        ↓
    Preprocessing
        ↓
    Embedding
        ↓
    ChromaDB
        ↓
    COMPLETED / FAILED
"""

from __future__ import annotations

import logging
import os
import shutil
import mimetypes
import uuid
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models import Document, DocumentStatus, User
from app.schemas import DocumentResponse, DocumentUpdate
from app.services.document.indexing import (
    DocumentIndexingError,
    index_document,
)
from app.services.embedding.dependencies import get_embedder
from app.services.embedding.embedder import DocumentEmbedder
from app.services.vectorstore.dependencies import get_vector_store
from app.services.vectorstore.store import VectorStore

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


# ============================================================
# CONFIGURATION
# ============================================================

UPLOAD_DIR = os.getenv(
    "UPLOAD_DIR",
    "/app/uploads",
)

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
}

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB


os.makedirs(
    UPLOAD_DIR,
    exist_ok=True,
)


# ============================================================
# 1. UPLOAD DOCUMENT
# ============================================================

@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    category_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    embedder: DocumentEmbedder = Depends(get_embedder),
    vector_store: VectorStore = Depends(get_vector_store),
):
    """
    Upload dokumen PDF/DOCX dan melakukan indexing.
    """

    # 1. VALIDASI NAMA FILE
    original_filename = os.path.basename(file.filename or "")

    if not original_filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nama file tidak valid.",
        )

    # 2. VALIDASI EXTENSION
    file_ext = os.path.splitext(original_filename)[1].lower()

    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Format file tidak didukung. "
                "Hanya menerima PDF (.pdf) dan DOCX (.docx)."
            ),
        )

    # 3. VALIDASI MIME TYPE
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Tipe file tidak valid. "
                "File harus berupa PDF atau DOCX."
            ),
        )

    # 4. BACA FILE
    try:
        contents = file.file.read()
    except Exception as exc:
        logger.exception(
            "Gagal membaca file upload '%s'.",
            original_filename,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gagal membaca file.",
        ) from exc

    file_size = len(contents)

    # 5. VALIDASI SIZE
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File tidak boleh kosong.",
        )

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Ukuran file terlalu besar. "
                "Maksimal 15 MB."
            ),
        )

    # 6. GENERATE NAMA FILE FISIK
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    saved_file_path = os.path.join(
        UPLOAD_DIR,
        unique_filename,
    )

    # 7. SIMPAN FILE
    try:
        with open(saved_file_path, "wb") as buffer:
            buffer.write(contents)
    except Exception as exc:
        logger.exception(
            "Gagal menyimpan file '%s'.",
            original_filename,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal menyimpan file.",
        ) from exc

    logger.info("File berhasil disimpan: %s", saved_file_path)

    # 8. SIMPAN METADATA KE POSTGRESQL
    document_title = (
        title.strip()
        if title and title.strip()
        else original_filename
    )

    new_document = Document(
        title=document_title,
        file_path=saved_file_path,
        file_type=file_ext.replace(".", "").upper(),
        file_size=file_size,
        status=DocumentStatus.PENDING,
        user_id=current_user.id,
        category_id=category_id,
    )

    try:
        db.add(new_document)
        db.commit()
        db.refresh(new_document)
    except Exception as exc:
        db.rollback()
        try:
            if os.path.exists(saved_file_path):
                os.remove(saved_file_path)
        except OSError:
            logger.exception(
                "Gagal menghapus file setelah database insert gagal: %s",
                saved_file_path,
            )

        logger.exception(
            "Gagal menyimpan metadata dokumen '%s' ke database.",
            original_filename,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal menyimpan metadata dokumen.",
        ) from exc

    document_id = str(new_document.id)
    logger.info(
        "Document dibuat: id=%s, filename='%s'",
        document_id,
        original_filename,
    )

    # 9. INDEXING
    try:
        index_document(
            document=new_document,
            db=db,
            embedder=embedder,
            vector_store=vector_store,
        )
        db.refresh(new_document)
    except DocumentIndexingError as exc:
        logger.error(
            "Indexing gagal untuk document_id=%s: %s",
            document_id,
            exc,
        )
        try:
            db.refresh(new_document)
        except Exception:
            logger.exception(
                "Gagal refresh document_id=%s setelah indexing gagal.",
                document_id,
            )

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Dokumen berhasil diupload tetapi gagal di-index: {exc}"
            ),
        ) from exc
    except Exception as exc:
        logger.exception(
            "Unexpected error saat indexing document_id=%s.",
            document_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Terjadi kesalahan saat melakukan indexing dokumen.",
        ) from exc

    # 10. RESPONSE
    return new_document


# ============================================================
# 2. LIST ALL DOCUMENTS (GLOBAL ACCESS)
# ============================================================

@router.get(
    "/",
    response_model=List[DocumentResponse],
)
def get_user_documents(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mengambil daftar seluruh dokumen yang ada di sistem.
    """

    if skip < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="skip tidak boleh negatif.",
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="limit harus berada antara 1 dan 100.",
        )

    # Dihapus filter Document.user_id == current_user.id
    query = db.query(Document)

    if search:
        query = query.filter(Document.title.ilike(f"%{search}%"))

    if category_id is not None:
        query = query.filter(Document.category_id == category_id)

    return (
        query
        .order_by(Document.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# ============================================================
# 3. GET DOCUMENT DETAIL
# ============================================================

@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
)
def get_document_by_id(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mengambil detail satu dokumen.
    """

    # Dihapus filter Document.user_id == current_user.id
    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dokumen tidak ditemukan.",
        )

    return document

@router.put(
    "/{document_id}",
    response_model=DocumentResponse,
)
def update_document(
    document_id: int,
    doc_in: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Memperbarui metadata dokumen (Judul dan/atau Kategori).
    """
    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dokumen tidak ditemukan.",
        )

    if doc_in.title is not None:
        title_stripped = doc_in.title.strip()
        if title_stripped:
            document.title = title_stripped

    if doc_in.category_id is not None:
        document.category_id = doc_in.category_id

    try:
        db.add(document)
        db.commit()
        db.refresh(document)
    except Exception as exc:
        db.rollback()
        logger.exception("Gagal memperbarui metadata dokumen ID %s.", document_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal memperbarui data dokumen di database.",
        ) from exc

    return document


# ============================================================
# 4. DOWNLOAD DOCUMENT
# ============================================================

@router.get(
    "/{document_id}/download",
)
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Download file asli dokumen.
    """

    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dokumen tidak ditemukan.",
        )

    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File fisik dokumen tidak ditemukan.",
        )

    # 1. Ambil ekstensi asli dari file_path fisik terlebih dahulu (Lebih Akurat)
    _, file_path_ext = os.path.splitext(document.file_path)
    ext = file_path_ext.lstrip(".").lower()

    # Jika dari file_path tidak ada, gunakan file_type dari DB
    if not ext and document.file_type:
        ext = str(document.file_type).lower().replace(".", "").strip()

    # 2. Ambil MIME Type spesifik
    if ext == "docx":
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif ext == "pdf":
        media_type = "application/pdf"
    else:
        media_type, _ = mimetypes.guess_type(document.file_path)
        if not media_type:
            media_type = "application/octet-stream"

    # 3. Rakit Nama File dengan Ekstensi Huruf Kecil yang Jelas
    clean_title = document.title.strip() if document.title else f"document_{document_id}"
    
    # Hapus ekstensi lama dari title jika user tidak sengaja memasukkannya di judul
    if clean_title.lower().endswith(f".{ext}"):
        clean_title = clean_title[:-len(ext)-1]

    download_filename = f"{clean_title}.{ext}"

    return FileResponse(
        path=document.file_path,
        filename=download_filename,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{download_filename}"'
        }
    )


# ============================================================
# 5. DELETE DOCUMENT
# ============================================================

@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store),
):
    """
    Menghapus dokumen.

    Opsi: Jika penghapusan hanya boleh dilakukan oleh pengunggah dokumen,
    tetapkan `Document.user_id == current_user.id`. Jika bebas, filter user_id bisa dihapus.
    """

    # Mengizinkan pembuat dokumen untuk menghapus dokumen miliknya
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dokumen tidak ditemukan atau Anda tidak memiliki hak akses untuk menghapusnya.",
        )

    document_id_str = str(document.id)

    # 1. HAPUS EMBEDDING CHROMADB
    try:
        deleted = vector_store.delete_document(
            document_id=document_id_str,
        )

        if not deleted:
            logger.warning(
                "Embedding ChromaDB untuk document_id=%s tidak berhasil dihapus.",
                document_id_str,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Gagal menghapus embedding dokumen dari vector store.",
            )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(
            "Error saat menghapus embedding document_id=%s.",
            document_id_str,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gagal menghapus embedding dokumen dari vector store.",
        ) from exc

    # 2. HAPUS FILE FISIK
    if os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except OSError as exc:
            logger.exception(
                "Gagal menghapus file fisik document_id=%s.",
                document_id_str,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Embedding berhasil dihapus, tetapi file fisik gagal dihapus.",
            ) from exc

    # 3. HAPUS RECORD POSTGRESQL
    try:
        db.delete(document)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.exception(
            "Gagal menghapus record database document_id=%s.",
            document_id_str,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File dan embedding mungkin sudah terhapus, tetapi record database gagal dihapus.",
        ) from exc

    logger.info("Dokumen berhasil dihapus: document_id=%s", document_id_str)

    return None