"""
check_rag.py

Integration test untuk RAG pipeline.

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
"""

from __future__ import annotations

import os

from google import genai
import chromadb

from app.services.preprocessing.pipeline import preprocess_document
from app.services.embedding.embedder import DocumentEmbedder
from app.services.vectorstore.store import VectorStore
from app.services.llm.service import LLMService
from app.services.rag.pipeline import RAGPipeline


# ----------------------------------------------------------------------
# CONFIGURATION
# ----------------------------------------------------------------------

TEST_DOCUMENT_ID = "rag-test-document-001"

TEST_PDF = (
    "/app/app/documents/"
    "AI_Knowledge_Base_Project_Proposal.pdf"
)

QUESTION = "Apa saja fitur yang terdapat dalam AI Knowledge Base?"

COLLECTION_NAME = "knowledge_base"

TOP_K = 3


def separator(title: str) -> None:
    print()
    print("=" * 70)
    print(title)
    print("=" * 70)


def main() -> None:

    print("=" * 70)
    print("RAG INTEGRATION TEST")
    print("=" * 70)

    # ==================================================================
    # 1. GEMINI CONNECTION
    # ==================================================================

    separator("1. GEMINI CONNECTION")

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        print("Gemini Client : FAILED")
        print("Error         : GEMINI_API_KEY belum dikonfigurasi.")
        return

    try:
        gemini_client = genai.Client(
            api_key=api_key,
        )

        print("Gemini Client : OK")

    except Exception as exc:
        print("Gemini Client : FAILED")
        print(f"Error         : {exc}")
        return

    # ==================================================================
    # 2. CHROMADB CONNECTION
    # ==================================================================

    separator("2. CHROMADB CONNECTION")

    try:
        chroma_host = os.getenv("CHROMA_HOST", "chromadb")
        chroma_port = int(os.getenv("CHROMA_PORT", "8000"))

        chroma_client = chromadb.HttpClient(
            host=chroma_host,
            port=chroma_port,
        )

        collection = chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
        )

        print("ChromaDB      : OK")
        print(f"Collection    : {COLLECTION_NAME}")
        print(f"Stored items  : {collection.count()}")

    except Exception as exc:
        print("ChromaDB      : FAILED")
        print(f"Error         : {exc}")
        return

    # ==================================================================
    # 3. INITIALIZE COMPONENTS
    # ==================================================================

    separator("3. INITIALIZE RAG COMPONENTS")

    try:
        embedder = DocumentEmbedder()

        vector_store = VectorStore(
            client=chroma_client,
            collection_name=COLLECTION_NAME,
        )

        llm_service = LLMService(
            client=gemini_client,
        )

        print("Embedding      : OK")
        print("VectorStore    : OK")
        print("Gemini LLM     : OK")

    except Exception as exc:
        print("Initialization : FAILED")
        print(f"Error          : {exc}")
        return

    # ==================================================================
    # 4. PREPARE TEST DOCUMENT
    # ==================================================================

    separator("4. PREPARE TEST DOCUMENT")

    if not os.path.exists(TEST_PDF):
        print("Test PDF      : FAILED")
        print(f"File tidak ditemukan: {TEST_PDF}")
        return

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
            return

        print("Preprocessing : OK")
        print(f"Segments      : {len(processed_document.segments)}")
        print(f"Chunks        : {len(processed_document.chunks)}")

    except Exception as exc:
        print("Preprocessing : FAILED")
        print(f"Error         : {exc}")
        return

    # ==================================================================
    # 5. EMBEDDING + STORE TO CHROMADB
    # ==================================================================

    separator("5. INDEX TEST DOCUMENT")

    try:
        embedded_document = embedder.embed(
            processed_document,
        )

        if not embedded_document.success:
            print("Embedding     : FAILED")
            print(f"Error         : {embedded_document.error}")
            return

        print("Embedding     : OK")
        print(
            f"Embedded chunks: "
            f"{len(embedded_document.embedded_chunks)}"
        )

        stored_document = vector_store.add_document(
            embedded_document,
        )

        if not stored_document.success:
            print("ChromaDB Store: FAILED")
            print(f"Error         : {stored_document.error}")
            return

        print("ChromaDB Store: OK")
        print(f"Chunks stored : {stored_document.num_chunks}")

    except Exception as exc:
        print("Indexing      : FAILED")
        print(f"Error         : {exc}")
        return

    # ==================================================================
    # 6. VERIFY CHROMADB
    # ==================================================================

    separator("6. VERIFY CHROMADB")

    try:
        stored_count = collection.count()

        print(f"Stored items  : {stored_count}")

        if stored_count == 0:
            print("ChromaDB      : FAILED")
            print("Tidak ada data setelah indexing.")
            return

        print("ChromaDB      : READY")

    except Exception as exc:
        print("ChromaDB      : FAILED")
        print(f"Error         : {exc}")
        return

    # ==================================================================
    # 7. CREATE RAG PIPELINE
    # ==================================================================

    separator("7. CREATE RAG PIPELINE")

    try:
        rag_pipeline = RAGPipeline(
            embedder=embedder,
            vector_store=vector_store,
            llm_service=llm_service,
            top_k=TOP_K,
        )

        print("RAG Pipeline  : OK")

    except Exception as exc:
        print("RAG Pipeline  : FAILED")
        print(f"Error         : {exc}")
        return

    # ==================================================================
    # 8. QUESTION
    # ==================================================================

    separator("8. QUESTION")

    print("Question:")
    print(QUESTION)

    # ==================================================================
    # 9. RUN RAG
    # ==================================================================

    separator("9. RUN RAG PIPELINE")

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

    try:
        result = rag_pipeline.answer(
            QUESTION,
        )

    except Exception as exc:
        print("RAG Result    : FAILED")
        print(f"Error         : {exc}")
        return

    # ==================================================================
    # 10. RESULT
    # ==================================================================

    separator("10. RAG RESULT")

    if not result.success:
        print("RAG Result    : FAILED")
        print(f"Error         : {result.error}")
        return

    print("RAG Result    : SUCCESS")

    print()
    print("ANSWER")
    print("-" * 70)
    print(result.answer)

    print()
    print("SOURCES")
    print("-" * 70)

    for index, source in enumerate(
        result.sources,
        start=1,
    ):
        print()
        print(f"Source #{index}")
        print(f"Document ID : {source.document_id}")
        print(f"Chunk ID    : {source.chunk_id}")
        print(f"Distance    : {source.distance:.6f}")
        print(f"Text        : {source.text[:200]}...")

    print()
    print(f"Total sources : {result.num_sources}")

    # ==================================================================
    # SUCCESS
    # ==================================================================

    print()
    print("=" * 70)
    print("ALL RAG TESTS PASSED")
    print("=" * 70)


if __name__ == "__main__":
    main()
