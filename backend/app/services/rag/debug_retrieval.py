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


TEST_DOCUMENT_ID = "rag-debug-document-001"

TEST_PDF = (
    "/app/app/documents/"
    "Sistem Pencernaan Manusia.docx"
)

QUESTION = "Apa hubungan konsumsi lemak dengan kesehatan tubuh?"

TOP_K = 10


def separator(title: str) -> None:
    print()
    print("=" * 80)
    print(title)
    print("=" * 80)


def main() -> None:

    print("=" * 80)
    print("RAG RETRIEVAL DEBUG")
    print("=" * 80)

    # ==============================================================
    # 1. INITIALIZE PIPELINE
    # ==============================================================

    separator("1. INITIALIZE RAG PIPELINE")

    try:
        reset_rag_pipeline()

        rag_pipeline: RAGPipeline = get_rag_pipeline()

        print("RAG Pipeline : OK")
        print(
            f"Collection   : "
            f"{rag_pipeline.vector_store.collection_name}"
        )

    except RAGPipelineInitError as exc:
        print("RAG Pipeline : FAILED")
        print(f"Error        : {exc}")
        sys.exit(1)

    embedder = rag_pipeline.embedder
    vector_store = rag_pipeline.vector_store

    # ==============================================================
    # 2. PREPARE DOCUMENT
    # ==============================================================

    separator("2. PREPARE TEST DOCUMENT")

    if not os.path.exists(TEST_PDF):
        print("Test PDF : FAILED")
        print(f"File tidak ditemukan: {TEST_PDF}")
        sys.exit(1)

    print(f"File        : {TEST_PDF}")
    print(f"Document ID : {TEST_DOCUMENT_ID}")

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

    try:

        # ==========================================================
        # 3. EMBEDDING + STORE
        # ==========================================================

        separator("3. INDEX TEST DOCUMENT")

        embedded_document = embedder.embed(processed_document)

        if not embedded_document.success:
            print("Embedding : FAILED")
            print(f"Error     : {embedded_document.error}")
            sys.exit(1)

        print("Embedding : OK")
        print(
            f"Embedded chunks: "
            f"{len(embedded_document.embedded_chunks)}"
        )

        stored_document = vector_store.add_document(
            embedded_document
        )

        if not stored_document.success:
            print("ChromaDB Store : FAILED")
            print(f"Error          : {stored_document.error}")
            sys.exit(1)

        print("ChromaDB Store : OK")
        print(f"Chunks stored  : {stored_document.num_chunks}")

        # ==========================================================
        # 4. QUERY
        # ==========================================================

        separator("4. QUERY")

        print("Question:")
        print(QUESTION)

        # ==========================================================
        # 5. QUERY EMBEDDING
        # ==========================================================

        separator("5. QUERY EMBEDDING")

        query_embedding = embedder.embed_query(QUESTION)

        if not query_embedding:
            print("Query embedding : FAILED")
            sys.exit(1)

        print("Query embedding : OK")
        print(f"Dimension       : {len(query_embedding)}")

        # ==========================================================
        # 6. VECTOR SEARCH
        # ==========================================================

        separator("6. VECTOR SEARCH")

        print(f"Top K       : {TOP_K}")
        print(f"Document ID : {TEST_DOCUMENT_ID}")

        search_results = vector_store.search(
            query_embedding=query_embedding,
            n_results=TOP_K,
            document_id=TEST_DOCUMENT_ID,
        )

        if not search_results.success:
            print("Vector Search : FAILED")
            print(f"Error         : {search_results.error}")
            sys.exit(1)

        print("Vector Search : OK")
        print(
            f"Results found: "
            f"{len(search_results.results)}"
        )

        # ==========================================================
        # 7. DISPLAY RETRIEVED CHUNKS
        # ==========================================================

        separator("7. RETRIEVED CHUNKS")

        if not search_results.results:
            print("❌ Tidak ada chunk yang ditemukan.")
        else:

            for index, result in enumerate(
                search_results.results,
                start=1,
            ):

                print()
                print("-" * 80)
                print(f"RESULT #{index}")
                print("-" * 80)

                print(f"Chunk ID   : {result.chunk_id}")
                print(f"Document ID: {result.document_id}")
                print(f"Distance   : {result.distance:.6f}")

                print()
                print("Metadata:")
                print(result.metadata)

                print()
                print("TEXT:")
                print(result.text)

        # ==========================================================
        # 8. NO GEMINI
        # ==========================================================

        separator("8. LLM")

        print("⏭ Gemini TIDAK dipanggil.")
        print("Retrieval debugging selesai.")
        print("Tidak menggunakan quota generate_content.")

    except Exception as exc:

        print()
        print("=" * 80)
        print("DEBUG FAILED")
        print("=" * 80)
        print(f"Error: {exc}")

    finally:

        # ==========================================================
        # 9. CLEANUP
        # ==========================================================

        separator("9. CLEANUP")

        deleted = vector_store.delete_document(
            TEST_DOCUMENT_ID
        )

        if deleted:
            print(
                f"Test document '{TEST_DOCUMENT_ID}' berhasil dihapus."
            )
        else:
            print(
                f"PERINGATAN: gagal menghapus "
                f"'{TEST_DOCUMENT_ID}'."
            )


if __name__ == "__main__":
    main()