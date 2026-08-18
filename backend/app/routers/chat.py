# app/routers/chat.py
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, or_

from app.database import get_db
from app.core.security import get_current_user
from app.models import ChatSession, ChatMessage, Document, User
from app.schemas.chat import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatMessageCreate,
    ChatMessageResponse
)
from app.services.rag_service import generate_rag_response

router = APIRouter(
    prefix="/chat",
    tags=["Chat & RAG"]
)


# ============================================================
# 1. MANAGEMENT SESI CHAT (CHAT SESSIONS)
# ============================================================

@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_chat_session(
    session_data: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Membuat sesi chat baru.
    - `document_id = null` -> Chatbot Global
    - `document_id = ID` -> Chatbot khusus dokumen spesifik
    """
    # Jika memasukkan document_id, pastikan dokumen tersebut ada
    if session_data.document_id:
        doc = db.get(Document, session_data.document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dokumen yang dipilih tidak ditemukan."
            )

    new_session = ChatSession(
        title=session_data.title or "New Chat",
        user_id=current_user.id,
        document_id=session_data.document_id
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_user_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mengambil seluruh daftar sesi chat milik user yang sedang login.
    """
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    return sessions


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_chat_session_detail(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mengambil detail sesi chat tertentu beserta riwayat gelembung pesannya.
    """
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesi chat tidak ditemukan."
        )
    return session


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Menghapus 1 sesi chat beserta seluruh riwayat pesannya.
    """
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesi chat tidak ditemukan."
        )

    db.delete(session)
    db.commit()
    return None


# ============================================================
# 2. MANAGEMENT PESAN & MOCK RAG (CHAT MESSAGES)
# ============================================================

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def get_session_messages(
    session_id: int,
    search: Optional[str] = Query(None, description="Cari teks di dalam riwayat chat"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mengambil riwayat pesan dari suatu sesi.
    Mendukung filter pencarian teks di dalam obrolan.
    """
    # Pastikan sesi milik user yang login
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesi chat tidak ditemukan."
        )

    query = db.query(ChatMessage).filter(ChatMessage.session_id == session_id)

    if search:
        query = query.filter(ChatMessage.content.ilike(f"%{search}%"))

    messages = query.order_by(ChatMessage.created_at.asc()).all()
    return messages


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    session_id: int,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mengirimkan prompt user, memanggil RAG Service, menyimpan balasan AI,
    dan mengembalikan pesan AI beserta metadata/sumber rujukan.
    """
    # 1. Validasi kepemilikan sesi
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesi chat tidak ditemukan."
        )

    # 2. Simpan Pesan User ke Database
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=payload.content
    )
    db.add(user_msg)

    # Auto-update judul sesi jika masih "New Chat"
    if session.title == "New Chat":
        session.title = payload.content[:30] + ("..." if len(payload.content) > 30 else "")

    session.updated_at = datetime.utcnow()
    db.commit()

    # 3. Panggil RAG Service (Mock / Asli)
    ai_answer, sources_metadata = await generate_rag_response(
        prompt=payload.content,
        document_id=session.document_id,
        db=db
    )

    # 4. Simpan Balasan AI ke Database (Perhatikan field msg_metadata)
    ai_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=ai_answer,
        msg_metadata=sources_metadata
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return ai_msg