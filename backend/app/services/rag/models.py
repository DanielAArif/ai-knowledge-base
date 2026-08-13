"""
models.py

Struktur data untuk RAG pipeline.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class RAGSource:
    """
    Satu sumber yang digunakan untuk menghasilkan jawaban.
    """

    chunk_id: str
    document_id: str
    text: str
    distance: float
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class RAGResponse:
    """
    Hasil akhir RAG pipeline.
    """

    question: str
    answer: str = ""
    sources: list[RAGSource] = field(default_factory=list)
    error: Optional[str] = None

    @property
    def success(self) -> bool:
        return self.error is None and bool(self.answer.strip())

    @property
    def num_sources(self) -> int:
        return len(self.sources)