"""
models.py
Struktur data untuk embedding pipeline.

Mengikuti pola yang sama dengan preprocessing/models.py: field `error`
dipakai untuk mengomunikasikan kegagalan lewat return value (bukan
exception), supaya konsisten dengan gaya short-circuit di pipeline.py.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from ..preprocessing.models import DocumentMetadata


@dataclass
class EmbeddedChunk:
    """
    Satu DocumentChunk yang sudah punya vector embedding, siap disimpan
    ke vector database.
    """
    chunk_id: int
    segment_index: int
    text: str
    embedding: list[float]


@dataclass
class EmbeddedDocument:
    """
    Kumpulan EmbeddedChunk untuk satu dokumen, plus metadata dokumen asal.
    """
    metadata: DocumentMetadata = field(default_factory=DocumentMetadata)
    embedded_chunks: list[EmbeddedChunk] = field(default_factory=list)
    error: Optional[str] = None

    @property
    def success(self) -> bool:
        return self.error is None

    @property
    def num_chunks(self) -> int:
        return len(self.embedded_chunks)