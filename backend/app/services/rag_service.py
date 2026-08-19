# app/services/rag_service.py
import logging
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session

# Import dependency RAGPipeline milik rekan Anda
from app.services.rag.dependencies import RAGPipelineInitError, get_rag_pipeline

logger = logging.getLogger(__name__)


async def generate_rag_response(
    prompt: str,
    document_id: Optional[int] = None,
    db: Optional[Session] = None
) -> Tuple[str, Dict[str, Any]]:
    
    logger.info("Memproses prompt via RAGPipeline: '%s' (document_id=%s)", prompt, document_id)

    try:
        pipeline = get_rag_pipeline()

        # Oper document_id ke pipeline.answer
        rag_response = pipeline.answer(
            question=prompt,
            top_k=3,
            document_id=document_id  # <--- Teruskan ke pipeline!
        )

        if not rag_response.success:
            return (
                f"Maaf, terjadi kesalahan: {rag_response.error}",
                {"error": rag_response.error}
            )

        sources_metadata = {
            "mode": "document_specific" if document_id else "global",
            "document_id": document_id,
            "tokens": {
                "prompt_tokens": rag_response.prompt_tokens,
                "completion_tokens": rag_response.completion_tokens,
                "total_tokens": rag_response.total_tokens,
            },
            "source_documents": [
                {
                    "chunk_id": s.chunk_id,
                    "document_id": s.document_id,
                    "text": s.text,
                    "distance": s.distance,
                    "metadata": s.metadata,
                }
                for s in (rag_response.sources or [])
            ]
        }

        return rag_response.answer, sources_metadata

    except Exception as exc:
        logger.exception("Error RAG Service: %s", exc)
        return ("Terjadi kesalahan internal pada sistem AI.", {"error": str(exc)})