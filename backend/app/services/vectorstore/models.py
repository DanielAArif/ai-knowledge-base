"""
models.py
Struktur data untuk vector store.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class StoredDocument:
    """
    Hasil penyimpanan EmbeddedDocument ke vector store.
    """

    document_id: str
    collection_name: str
    chunk_ids: list[str] = field(default_factory=list)
    error: Optional[str] = None

    @property
    def success(self) -> bool:
        return self.error is None

    @property
    def num_chunks(self) -> int:
        return len(self.chunk_ids)


@dataclass
class SearchResult:
    """
    Satu hasil similarity search.
    """

    chunk_id: str
    document_id: str
    text: str
    distance: float
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class SearchResults:
    """
    Kumpulan hasil similarity search.
    """

    results: list[SearchResult] = field(default_factory=list)
    error: Optional[str] = None

    @property
    def success(self) -> bool:
        return self.error is None

    @property
    def num_results(self) -> int:
        return len(self.results)