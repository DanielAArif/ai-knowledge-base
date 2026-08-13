"""
pipeline.py

RAG pipeline.

Alur:
    question
        ↓
    embedding query
        ↓
    vector search
        ↓
    context building
        ↓
    LLM generation
        ↓
    answer + sources
"""

from __future__ import annotations

import logging

from app.services.embedding.embedder import DocumentEmbedder
from app.services.llm.service import LLMService
from app.services.vectorstore.models import SearchResults
from app.services.vectorstore.store import VectorStore

from .models import RAGResponse, RAGSource


logger = logging.getLogger(__name__)


DEFAULT_TOP_K = 3


class RAGPipeline:
    """
    Pipeline untuk Retrieval-Augmented Generation.

    Retrieval dilakukan melalui VectorStore.
    Generation dilakukan melalui LLMService.
    """

    def __init__(
        self,
        embedder: DocumentEmbedder,
        vector_store: VectorStore,
        llm_service: LLMService,
        top_k: int = DEFAULT_TOP_K,
    ):
        if top_k <= 0:
            raise ValueError(
                "top_k harus lebih besar dari 0."
            )

        self.embedder = embedder
        self.vector_store = vector_store
        self.llm_service = llm_service
        self.top_k = top_k

    def answer(
        self,
        question: str,
    ) -> RAGResponse:
        """
        Menjawab pertanyaan menggunakan RAG.
        """

        if not question or not question.strip():
            return RAGResponse(
                question=question,
                error="Pertanyaan tidak boleh kosong.",
            )

        question = question.strip()

        try:
            # --------------------------------------------------
            # 1. EMBEDDING QUERY
            # --------------------------------------------------

            query_embedding = self._embed_query(
                question,
            )

            if not query_embedding:
                return RAGResponse(
                    question=question,
                    error="Gagal menghasilkan embedding query.",
                )

            # --------------------------------------------------
            # 2. VECTOR SEARCH
            # --------------------------------------------------

            search_results = self.vector_store.search(
                query_embedding=query_embedding,
                n_results=self.top_k,
            )

            if not search_results.success:
                return RAGResponse(
                    question=question,
                    error=search_results.error,
                )

            if not search_results.results:
                return RAGResponse(
                    question=question,
                    error="Tidak ditemukan context yang relevan.",
                )

            # --------------------------------------------------
            # 3. BUILD SOURCES
            # --------------------------------------------------

            sources = [
                RAGSource(
                    chunk_id=result.chunk_id,
                    document_id=result.document_id,
                    text=result.text,
                    distance=result.distance,
                    metadata=result.metadata,
                )
                for result in search_results.results
            ]

            # --------------------------------------------------
            # 4. BUILD CONTEXT
            # --------------------------------------------------

            context = self._build_context(
                search_results,
            )

            # --------------------------------------------------
            # 5. BUILD PROMPT
            # --------------------------------------------------

            prompt = self._build_prompt(
                question=question,
                context=context,
            )

            # --------------------------------------------------
            # 6. LLM GENERATION
            # --------------------------------------------------

            llm_response = self.llm_service.generate(
                prompt,
            )

            if not llm_response.success:
                return RAGResponse(
                    question=question,
                    sources=sources,
                    error=llm_response.error,
                )

            # --------------------------------------------------
            # 7. RETURN
            # --------------------------------------------------

            logger.info(
                "RAG berhasil: question='%s', sources=%d.",
                question,
                len(sources),
            )

            return RAGResponse(
                question=question,
                answer=llm_response.answer,
                sources=sources,
            )

        except Exception as exc:
            logger.error(
                "RAG pipeline gagal: %s",
                exc,
            )

            return RAGResponse(
                question=question,
                error=(
                    f"Gagal menjalankan RAG pipeline: {exc}"
                ),
            )

    def _embed_query(
        self,
        question: str,
    ) -> list[float]:
        """
        Menghasilkan embedding untuk user query
        menggunakan DocumentEmbedder.
        """

        return self.embedder.embed_query(
            question,
        )

    @staticmethod
    def _build_context(
        search_results: SearchResults,
    ) -> str:
        """
        Menggabungkan hasil retrieval menjadi context.
        """

        context_parts: list[str] = []

        for index, result in enumerate(
            search_results.results,
            start=1,
        ):
            context_parts.append(
                f"[Source {index}]\n"
                f"Document ID: {result.document_id}\n"
                f"Chunk ID: {result.chunk_id}\n"
                f"{result.text}"
            )

        return "\n\n".join(context_parts)

    @staticmethod
    def _build_prompt(
        question: str,
        context: str,
    ) -> str:
        """
        Membuat prompt RAG untuk LLM.
        """

        return f"""
Anda adalah AI Knowledge Base Assistant.

Jawab pertanyaan pengguna berdasarkan context
yang diberikan di bawah.

Aturan:
1. Gunakan hanya informasi yang terdapat dalam context.
2. Jangan mengarang informasi yang tidak tersedia.
3. Jika context tidak cukup untuk menjawab,
   katakan bahwa informasi tidak ditemukan.
4. Jawab dalam bahasa Indonesia.
5. Jawab dengan jelas dan ringkas.

CONTEXT:
{context}

PERTANYAAN:
{question}

JAWABAN:
""".strip()