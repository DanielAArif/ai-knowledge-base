"""
schemas/query.py

Request/response schema untuk endpoint RAG query.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    """
    Request body untuk POST /query.
    """

    question: str = Field(
        ...,
        min_length=1,
        description="Pertanyaan yang ingin diajukan ke knowledge base.",
    )
    top_k: int = Field(
        default=3,
        ge=1,
        le=20,
        description="Jumlah chunk konteks yang diambil dari vectorstore.",
    )


class SourceItem(BaseModel):
    """
    Satu sumber yang dipakai untuk menyusun jawaban.
    """

    chunk_id: str
    document_id: str
    text: str
    distance: float
    metadata: dict[str, Any] = {}


class QueryResponse(BaseModel):
    """
    Response body untuk POST /query.
    """

    question: str
    answer: str
    sources: list[SourceItem] = []
    num_sources: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0