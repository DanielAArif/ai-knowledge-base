# INI ADALAH FILE MOCK UNTUK SIMULASI RAG (Retrieval-Augmented Generation) UNTUK PENGUJIAN TANPA MEMANGGIL LLM SEBENARNYA.

# app/services/rag_service.py
import logging
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.document import Document

logger = logging.getLogger(__name__)

async def generate_rag_response(
    prompt: str,
    document_id: Optional[int] = None,
    db: Optional[Session] = None
) -> Tuple[str, Dict[str, Any]]:
    """
    Simulasi/Mock generator jawaban AI RAG.
    
    Returns:
        Tuple[str, Dict[str, Any]]: (Jawaban AI, Metadata / Source Documents)
    """
    logger.info("Menerima prompt untuk Mock RAG: '%s' (document_id=%s)", prompt, document_id)

    # Mode 1: Chat terisolasi pada 1 Dokumen spesifik
    if document_id:
        doc_title = "Dokumen Spesifik"
        if db:
            doc = db.get(Document, document_id)
            if doc:
                doc_title = doc.title

        answer = (
            f"[MOCK AI - DOKUMEN SPEKSIFIK]\n\n"
            f"Berdasarkan dokumen '{doc_title}', berikut informasi terkait pertanyaan Anda ('{prompt}'):\n"
            f"1. Dokumen ini memuat informasi relevan pada Bagian 2.\n"
            f"2. Konten merujuk pada ketentuan yang berlaku dalam file tersebut."
        )
        sources = {
            "mode": "document_specific",
            "document_id": document_id,
            "source_documents": [
                {"title": doc_title, "page": 1, "score": 0.92},
                {"title": doc_title, "page": 3, "score": 0.85}
            ]
        }

    # Mode 2: Chatbot Global (Menjelajah seluruh Knowledge Base)
    else:
        answer = (
            f"[MOCK AI - GLOBAL KNOWLEDGE BASE]\n\n"
            f"Menjawab pertanyaan Anda tentang '{prompt}':\n"
            f"Sistem telah menganalisis basis pengetahuan global dan menemukan beberapa rujukan terkait kueri ini."
        )
        sources = {
            "mode": "global",
            "source_documents": [
                {"title": "SOP_Perusahaan.pdf", "page": 4, "score": 0.89},
                {"title": "Panduan_Karyawan.docx", "page": 12, "score": 0.78}
            ]
        }

    return answer, sources