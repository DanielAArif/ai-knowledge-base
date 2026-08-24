"""
check_rag.py

Manual integration check untuk RAG pipeline.

PENTING:
Script ini melakukan request nyata ke ChromaDB dan Gemini API
(berbayar), dan akan menulis + menghapus satu dokumen test di
collection produksi. Sengaja diberi nama check_* (bukan test_*)
supaya TIDAK ikut ter-auto-discover oleh pytest.

Jalankan manual:

    python -m app.services.rag.check_rag

Perbedaan dari versi sebelumnya:
1. RAGPipeline dirakit lewat get_rag_pipeline() (dependencies.py),
   yaitu jalur konstruksi yang SAMA PERSIS dipakai endpoint
   POST /query. Kalau ada bug di wiring dependencies.py, check
   ini akan menangkapnya -- beda dari versi lama yang merakit
   client secara manual dan terpisah dari jalur produksi.
2. embedder dan vector_store di-reuse dari rag_pipeline (bukan
   dibuat instance baru), supaya DocumentEmbedder tidak memuat
   model dua kali.
3. Dokumen test dihapus otomatis di akhir (blok finally), supaya
   tidak menumpuk sampah di collection produksi walau check gagal
   di tengah jalan.

Alur yang diuji:

    PDF
        ↓
    Preprocessing
        ↓
    Embedding
        ↓
    ChromaDB
        ↓
    Question
        ↓
    Query Embedding
        ↓
    Similarity Search
        ↓
    Context Building
        ↓
    Gemini
        ↓
    Answer + Sources
        ↓
    Cleanup
"""

from __future__ import annotations

import os
import sys

from app.services.preprocessing.pipeline import preprocess_document
from app.services.rag.dependencies import (
    RAGPipelineInitError,
    get_rag_pipeline,
    reset_rag_pipeline,
)
from app.services.rag.pipeline import RAGPipeline


# ----------------------------------------------------------------------
# CONFIGURATION
# ----------------------------------------------------------------------

TEST_DOCUMENT_ID = "rag-test-document-001"

TEST_PDF = (
    "/app/app/documents/"
    "Sistem Pencernaan Manusia.docx"
)

QUESTION = "Apa hubungan konsumsi lemak dengan kesehatan tubuh?"

TOP_K = 3


def separator(title: str) -> None:
    print()
    print("=" * 70)
    print(title)
    print("=" * 70)


def main() -> None:

    print("=" * 70)
    print("RAG INTEGRATION CHECK")
    print("=" * 70)

    # ==================================================================
    # 1. INITIALIZE RAG PIPELINE (jalur produksi asli)
    # ==================================================================

    separator("1. INITIALIZE RAG PIPELINE")

    try:
        reset_rag_pipeline()

        rag_pipeline: RAGPipeline = get_rag_pipeline()

        print("RAG Pipeline  : OK")
        print(f"Collection    : {rag_pipeline.vector_store.collection_name}")

    except RAGPipelineInitError as exc:
        print("RAG Pipeline  : FAILED")
        print(f"Error         : {exc}")
        sys.exit(1)

    embedder = rag_pipeline.embedder
    vector_store = rag_pipeline.vector_store

    # ==================================================================
    # 2. PREPARE TEST DOCUMENT
    # ==================================================================

    separator("2. PREPARE TEST DOCUMENT")

    if not os.path.exists(TEST_PDF):
        print("Test PDF      : FAILED")
        print(f"File tidak ditemukan: {TEST_PDF}")
        sys.exit(1)

    print(f"File           : {TEST_PDF}")
    print(f"Document ID    : {TEST_DOCUMENT_ID}")

    try:
        processed_document = preprocess_document(
            filepath=TEST_PDF,
            document_id=TEST_DOCUMENT_ID,
        )

        if not processed_document.success:
            print("Preprocessing : FAILED")
            print(f"Error         : {processed_document.error}")
            sys.exit(1)

        print("Preprocessing : OK")
        print(f"Segments      : {len(processed_document.segments)}")
        print(f"Chunks        : {len(processed_document.chunks)}")

    except Exception as exc:
        print("Preprocessing : FAILED")
        print(f"Error         : {exc}")
        sys.exit(1)

    # ==================================================================
    # Dari titik ini, dokumen test akan ditulis ke collection.
    # Blok try/finally memastikan dokumen test SELALU dihapus di
    # akhir, baik check ini berhasil maupun gagal di tengah jalan.
    # ==================================================================

    exit_code = 0

    try:
        # --------------------------------------------------------
        # 3. EMBEDDING + STORE TO CHROMADB
        # --------------------------------------------------------

        separator("3. INDEX TEST DOCUMENT")

        embedded_document = embedder.embed(processed_document)

        if not embedded_document.success:
            print("Embedding     : FAILED")
            print(f"Error         : {embedded_document.error}")
            sys.exit(1)

        print("Embedding     : OK")
        print(
            f"Embedded chunks: {len(embedded_document.embedded_chunks)}"
        )

        stored_document = vector_store.add_document(embedded_document)

        if not stored_document.success:
            print("ChromaDB Store: FAILED")
            print(f"Error         : {stored_document.error}")
            sys.exit(1)

        print("ChromaDB Store: OK")
        print(f"Chunks stored : {stored_document.num_chunks}")

        # --------------------------------------------------------
        # 4. VERIFY CHROMADB
        # --------------------------------------------------------

        separator("4. VERIFY CHROMADB")

        stored_count = vector_store.collection.count()

        print(f"Stored items  : {stored_count}")

        if stored_count == 0:
            print("ChromaDB      : FAILED")
            print("Tidak ada data setelah indexing.")
            sys.exit(1)

        print("ChromaDB      : READY")

        # --------------------------------------------------------
        # 5. QUESTION
        # --------------------------------------------------------

        separator("5. QUESTION")

        print("Question:")
        print(QUESTION)

        # --------------------------------------------------------
        # 6. RUN RAG PIPELINE
        # --------------------------------------------------------

        separator("6. RUN RAG PIPELINE")

        print()
        print("Question")
        print("   ↓")
        print("Embedding")
        print("   ↓")
        print("ChromaDB Search")
        print("   ↓")
        print("Context Building")
        print("   ↓")
        print("Gemini")
        print("   ↓")
        print("Answer + Sources")
        print()
        print("Generating response...")

        result = rag_pipeline.answer(QUESTION, top_k=TOP_K)

        # --------------------------------------------------------
        # 7. RESULT
        # --------------------------------------------------------

        separator("7. RAG RESULT")

        if not result.success:
            print("RAG Result    : FAILED")
            print(f"Error         : {result.error}")
            exit_code = 1

        else:
            print("RAG Result    : SUCCESS")

            print()
            print("ANSWER")
            print("-" * 70)
            print(result.answer)

            print()
            print("SOURCES")
            print("-" * 70)

            for index, source in enumerate(result.sources, start=1):
                print()
                print(f"Source #{index}")
                print(f"Document ID : {source.document_id}")
                print(f"Chunk ID    : {source.chunk_id}")
                print(f"Distance    : {source.distance:.6f}")
                print(f"Text        : {source.text[:200]}...")

            print()
            print(f"Total sources      : {result.num_sources}")
            print(f"Prompt tokens      : {result.prompt_tokens}")
            print(f"Completion tokens  : {result.completion_tokens}")
            print(f"Total tokens       : {result.total_tokens}")

    except Exception as exc:
        print("RAG Check     : FAILED")
        print(f"Error         : {exc}")
        exit_code = 1

    finally:
        # --------------------------------------------------------
        # 8. CLEANUP
        # --------------------------------------------------------

        separator("8. CLEANUP")

        deleted = vector_store.delete_document(TEST_DOCUMENT_ID)

        if deleted:
            print(f"Test document '{TEST_DOCUMENT_ID}' dihapus.")
        else:
            print(
                f"PERINGATAN: gagal menghapus test document "
                f"'{TEST_DOCUMENT_ID}'. Hapus manual jika perlu."
            )

    print()
    print("=" * 70)
    print("RAG CHECK PASSED" if exit_code == 0 else "RAG CHECK FAILED")
    print("=" * 70)

    sys.exit(exit_code)


if __name__ == "__main__":
    main()