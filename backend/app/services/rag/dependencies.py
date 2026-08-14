"""
dependencies.py

Factory untuk merakit RAGPipeline.

Di-cache sebagai singleton karena DocumentEmbedder biasanya
memuat model embedding (mahal untuk dibuat berulang kali per
request).
"""

from __future__ import annotations

from functools import lru_cache

from app.services.embedding.embedder import DocumentEmbedder
from app.services.llm.client import LLMConnectionError, get_llm_client
from app.services.llm.service import LLMService
from app.services.vectorstore.client import ChromaConnectionError, get_chroma_client
from app.services.vectorstore.store import DEFAULT_COLLECTION, VectorStore

from .pipeline import RAGPipeline


class RAGPipelineInitError(RuntimeError):
    """
    Dilempar ketika RAGPipeline gagal dirakit
    (embedder/vectorstore/llm client gagal disiapkan).
    """


@lru_cache(maxsize=1)
def get_rag_pipeline() -> RAGPipeline:
    """
    Membuat dan meng-cache RAGPipeline sebagai singleton.
    """

    try:
        embedder = DocumentEmbedder()

        chroma_client = get_chroma_client()
        vector_store = VectorStore(
            client=chroma_client,
            collection_name=DEFAULT_COLLECTION,
        )

        llm_client = get_llm_client()
        llm_service = LLMService(client=llm_client)

        return RAGPipeline(
            embedder=embedder,
            vector_store=vector_store,
            llm_service=llm_service,
        )

    except (ChromaConnectionError, LLMConnectionError) as exc:
        raise RAGPipelineInitError(
            f"Gagal menyiapkan RAG pipeline: {exc}"
        ) from exc


def reset_rag_pipeline() -> None:
    """
    Membersihkan cache RAGPipeline. Berguna untuk testing.
    """

    get_rag_pipeline.cache_clear()