"""
models.py

Struktur data yang mengalir melalui pipeline preprocessing:

    extractor -> metadata -> cleaner -> chunker

Extractor menghasilkan DocumentSegment (halaman/slide).
Chunker menghasilkan DocumentChunk (potongan teks untuk embedding).

Dengan memisahkan Segment dan Chunk, struktur asli dokumen tetap
tersimpan sehingga sumber jawaban AI (halaman/slide) dapat dilacak.
"""

from __future__ import annotations

from dataclasses import dataclass, field, replace
from typing import Optional


@dataclass
class DocumentSegment:
    """
    Unit teks hasil ekstraksi.

    Maknanya tergantung jenis file:

    - PDF  : 1 segment = 1 halaman
    - DOCX : 1 segment = seluruh dokumen
    - PPTX : 1 segment = 1 slide (nanti)
    """

    index: int
    text: str


@dataclass
class DocumentChunk:
    """
    Potongan teks hasil chunking.

    Chunk inilah yang nantinya akan diubah menjadi embedding dan
    disimpan ke vector database.
    """

    chunk_id: int
    segment_index: int
    text: str


@dataclass
class DocumentMetadata:
    """
    Metadata dokumen.

    Diisi oleh metadata.py.
    """

    filename: str = ""
    file_type: str = ""
    title: str = ""
    author: str = ""


@dataclass
class ProcessedDocument:
    """
    Objek utama yang mengalir sepanjang pipeline preprocessing.
    """

    full_text: str = ""

    # Hasil extractor
    segments: list[DocumentSegment] = field(default_factory=list)

    # Hasil chunker
    chunks: list[DocumentChunk] = field(default_factory=list)

    metadata: DocumentMetadata = field(default_factory=DocumentMetadata)

    error: Optional[str] = None

    @property
    def success(self) -> bool:
        return self.error is None

    @property
    def num_segments(self) -> int:
        return len(self.segments)

    @property
    def num_chunks(self) -> int:
        return len(self.chunks)

    def with_text(
        self,
        full_text: str,
        segments: list[DocumentSegment],
    ) -> "ProcessedDocument":
        """
        Dipakai oleh cleaner.py.

        Metadata dan chunks tetap dipertahankan.
        """

        return replace(
            self,
            full_text=full_text,
            segments=segments,
        )

    def with_chunks(
        self,
        chunks: list[DocumentChunk],
    ) -> "ProcessedDocument":
        """
        Dipakai oleh chunker.py.
        """

        return replace(
            self,
            chunks=chunks,
        )

    def with_metadata(
        self,
        metadata: DocumentMetadata,
    ) -> "ProcessedDocument":
        """
        Dipakai oleh metadata.py.
        """

        return replace(
            self,
            metadata=metadata,
        )

    def with_error(
        self,
        error: str,
    ) -> "ProcessedDocument":
        return replace(
            self,
            error=error,
        )