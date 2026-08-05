import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Document, DocumentStatus, User
from app.schemas import DocumentResponse
from app.core.security import get_current_user

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

# Direktori penyimpanan file di dalam container Docker
UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Format file yang diizinkan (PDF dan DOCX)
ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
MAX_FILE_SIZE = 15 * 1024 * 1024  # Maksimal 15 MB


# 1. Endpoint Upload Dokumen (PDF / DOCX)
@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    category_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ekstrak ekstensi file
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    # Validasi format ekstensi
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format file tidak didukung. Hanya menerima file PDF (.pdf) dan DOCX (.docx)."
        )

    # Membaca konten file untuk hitung ukuran & simpan
    contents = await file.read()
    file_size = len(contents)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ukuran file terlalu besar. Maksimal 15 MB."
        )

    # Buat nama file unik menggunakan UUID untuk mencegah penimpaan file dengan nama sama
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    saved_file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Simpan file ke sistem penyimpanan fisik
    with open(saved_file_path, "wb") as f:
        f.write(contents)

    # Tentukan judul dokumen
    doc_title = title if title else file.filename

    # Simpan metadata ke Database PostgreSQL
    new_doc = Document(
        title=doc_title,
        file_path=saved_file_path,
        file_type=file_ext.replace(".", "").upper(),  # 'PDF' atau 'DOCX'
        file_size=file_size,
        status=DocumentStatus.PENDING,
        user_id=current_user.id,
        category_id=category_id
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return new_doc


# 2. Endpoint List Semua Dokumen Pengguna
@router.get("/", response_model=List[DocumentResponse])
def get_user_documents(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document).filter(Document.user_id == current_user.id)
    
    if category_id:
        query = query.filter(Document.category_id == category_id)
        
    return query.offset(skip).limit(limit).all()


# 3. Endpoint Detail Dokumen Berdasarkan ID
@router.get("/{document_id}", response_model=DocumentResponse)
def get_document_by_id(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id, 
        Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dokumen tidak ditemukan."
        )
    return doc


# 4. Endpoint Download/Stream Dokumen Fizik
@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id, 
        Document.user_id == current_user.id
    ).first()

    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Berkas fisik dokumen tidak ditemukan."
        )

    return FileResponse(
        path=doc.file_path,
        filename=f"{doc.title}.{doc.file_type.lower()}",
        media_type="application/octet-stream"
    )


# 5. Endpoint Hapus Dokumen
@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id, 
        Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dokumen tidak ditemukan."
        )

    # Hapus file fisik dari server jika ada
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    # Hapus record dari database
    db.delete(doc)
    db.commit()
    return None