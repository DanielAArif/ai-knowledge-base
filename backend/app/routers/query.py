"""
routers/query.py

Endpoint untuk bertanya ke knowledge base (RAG).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.schemas.query import QueryRequest, QueryResponse
from app.services.rag.dependencies import RAGPipelineInitError, get_rag_pipeline
from app.services.rag.pipeline import RAGPipeline

router = APIRouter(prefix="/query", tags=["query"])


def _get_pipeline() -> RAGPipeline:
    """
    Dependency FastAPI: menyediakan RAGPipeline singleton.

    Kegagalan inisialisasi (embedder/vectorstore/llm client)
    dipetakan ke 503, bukan 502, karena ini masalah kesiapan
    service, bukan kegagalan menjalankan request tertentu.
    """

    try:
        return get_rag_pipeline()
    except RAGPipelineInitError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("", response_model=QueryResponse)
def query_knowledge_base(
    request: QueryRequest,
    pipeline: RAGPipeline = Depends(_get_pipeline),
) -> QueryResponse:
    """
    Menjawab pertanyaan menggunakan RAG (retrieval + generation).

    Catatan: fungsi ini sengaja `def` biasa (bukan `async def`).
    RAGPipeline.answer() memanggil DocumentEmbedder, ChromaDB, dan
    Gemini API secara sinkron (blocking I/O). FastAPI otomatis
    menjalankan endpoint `def` biasa di threadpool terpisah,
    sehingga tidak memblokir event loop utama.
    """

    result = pipeline.answer(
        question=request.question,
        top_k=request.top_k,
    )

    if not result.success:
        raise HTTPException(status_code=502, detail=result.error)

    return QueryResponse(
        question=result.question,
        answer=result.answer,
        sources=[
            {
                "chunk_id": s.chunk_id,
                "document_id": s.document_id,
                "text": s.text,
                "distance": s.distance,
                "metadata": s.metadata,
            }
            for s in result.sources
        ],
        num_sources=result.num_sources,
        prompt_tokens=result.prompt_tokens,
        completion_tokens=result.completion_tokens,
        total_tokens=result.total_tokens,
    )