"""
models.py

Struktur data untuk tahap embedding.

Alur:

    ProcessedDocument
            ↓
    embed_document()
            ↓
    EmbeddedDocument

Setiap DocumentChunk dari preprocessing akan diubah menjadi
EmbeddedChunk yang berisi vektor embedding.

Model pada modul ini hanya merepresentasikan hasil embedding.
Penyimpanan ke vector database dilakukan pada tahap berikutnya.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.services.preprocessing.models import (
    DocumentMetadata,
)


@dataclass
class EmbeddedChunk:
    """
    Hasil embedding dari satu DocumentChunk.

    Tetap menyimpan informasi asal chunk supaya nanti dapat
    ditelusuri kembali ke halaman/slide sumbernya.
    """

    chunk_id: int
    segment_index: int

    text: str

    embedding: list[float]


@dataclass
class EmbeddedDocument:
    """
    Hasil embedding seluruh dokumen.
    """

    metadata: DocumentMetadata

    embedded_chunks: list[EmbeddedChunk] = field(default_factory=list)

    @property
    def num_chunks(self) -> int:
        return len(self.embedded_chunks)