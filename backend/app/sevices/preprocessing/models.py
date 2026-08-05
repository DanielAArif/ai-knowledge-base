"""
models.py
Struktur data bersama yang mengalir melalui seluruh pipeline preprocessing:

    extractor -> metadata -> cleaner -> chunker

Semua tahap menerima dan mengembalikan ProcessedDocument yang sama. Tiap
tahap hanya boleh mengubah bagian yang jadi tanggung jawabnya:
    - extractor.py -> mengisi full_text & segments
    - metadata.py  -> mengisi metadata
    - cleaner.py   -> mengubah full_text & segments (metadata tetap dibawa)
    - chunker.py   -> membaca full_text/segments/metadata, menghasilkan chunks

Field yang tidak disentuh oleh suatu tahap otomatis ikut terbawa lewat
dataclasses.replace() (lihat method with_text/with_metadata di bawah),
jadi tidak ada informasi yang hilang di tengah jalan.
"""

from __future__ import annotations

from dataclasses import dataclass, field, replace
from typing import Optional


@dataclass
class DocumentSegment:
    """
    Satu unit teks dalam dokumen. Maknanya tergantung tipe file:
    - DOCX -> 1 segmen berisi seluruh isi dokumen
    - PDF  -> 1 segmen = 1 halaman
    - PPTX (nanti) -> 1 segmen = 1 slide
    """
    index: int
    text: str


@dataclass
class DocumentMetadata:
    """
    Metadata dokumen, diisi oleh metadata.py. Sebelum tahap itu berjalan,
    semua field masih kosong (default "").
    """
    filename: str = ""
    file_type: str = ""
    title: str = ""
    author: str = ""


@dataclass
class ProcessedDocument:
    """
    Objek tunggal yang mengalir dari satu tahap pipeline ke tahap berikutnya.
    """
    full_text: str = ""
    segments: list[DocumentSegment] = field(default_factory=list)
    metadata: DocumentMetadata = field(default_factory=DocumentMetadata)
    error: Optional[str] = None

    @property
    def success(self) -> bool:
        return self.error is None

    @property
    def num_segments(self) -> int:
        return len(self.segments)

    def with_text(self, full_text: str, segments: list[DocumentSegment]) -> "ProcessedDocument":
        """
        Dipakai oleh tahap yang cuma mengubah teks (mis. cleaner.py).
        metadata & field lain otomatis ikut terbawa tanpa perlu ditulis ulang.
        """
        return replace(self, full_text=full_text, segments=segments)

    def with_metadata(self, metadata: DocumentMetadata) -> "ProcessedDocument":
        """Dipakai oleh metadata.py. full_text & segments tidak berubah."""
        return replace(self, metadata=metadata)

    def with_error(self, error: str) -> "ProcessedDocument":
        return replace(self, error=error)