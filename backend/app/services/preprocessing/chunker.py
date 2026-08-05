"""
chunker.py
Tahap keempat pipeline: extractor -> metadata -> cleaner -> chunker

Tanggung jawab modul ini: memecah teks hasil cleaning menjadi chunk yang
siap dipakai pada tahap embedding.

Chunk dibuat PER SEGMENT (mis. per halaman PDF) supaya hubungan antara
chunk dan sumber aslinya tetap terjaga. Informasi tersebut nantinya bisa
digunakan AI untuk menampilkan sumber jawaban (halaman/slide).

Modul ini TIDAK melakukan embedding maupun menyimpan ke vector database.

Dependencies:
    pip install langchain-text-splitters
"""

from __future__ import annotations

from langchain_text_splitters import RecursiveCharacterTextSplitter

from .models import DocumentChunk, ProcessedDocument


DEFAULT_CHUNK_SIZE = 1000
DEFAULT_CHUNK_OVERLAP = 200


class DocumentChunker:
    """
    Chunker berbasis RecursiveCharacterTextSplitter.

    Chunk dibuat per-segment agar informasi asal dokumen (mis. nomor
    halaman PDF) tetap dapat dilacak.
    """

    def __init__(
        self,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    ):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=[
                "\n\n",
                "\n",
                ". ",
                " ",
                "",
            ],
        )

    def chunk(self, doc: ProcessedDocument) -> ProcessedDocument:
        """
        Memecah seluruh DocumentSegment menjadi DocumentChunk.

        Tahap ini TIDAK mengubah:
            - full_text
            - segments
            - metadata

        Yang ditambahkan hanyalah field chunks.
        """

        if not doc.success:
            return doc

        chunks: list[DocumentChunk] = []

        chunk_id = 1

        for segment in doc.segments:
            texts = self.splitter.split_text(segment.text)

            for text in texts:
                chunks.append(
                    DocumentChunk(
                        chunk_id=chunk_id,
                        segment_index=segment.index,
                        text=text,
                    )
                )

                chunk_id += 1

        return doc.with_chunks(chunks)


def chunk_document(
    doc: ProcessedDocument,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> ProcessedDocument:
    """
    Entry point utama, dipanggil dari pipeline.py setelah clean_document().

    Contoh:

        doc = extract_document(filepath)
        doc = build_metadata(filepath, doc)
        doc = clean_document(doc)
        doc = chunk_document(doc)

        print(doc.num_chunks)
    """

    chunker = DocumentChunker(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )

    return chunker.chunk(doc)


if __name__ == "__main__":
    print(
        "Chunker adalah bagian dari pipeline.\n"
        "Jalankan melalui pipeline.py untuk pengujian."
    )