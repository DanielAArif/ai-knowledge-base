"""
test_vectorstore.py

Integration test untuk Vector Store.

Alur yang diuji:

    PDF
      ↓
    Preprocessing
      ↓
    Embedding (FastEmbed)
      ↓
    ChromaDB
      ↓
    Similarity Search
      ↓
    Delete

Test ini membutuhkan:
- ChromaDB berjalan
- Backend berada pada Docker network yang sama
- FastEmbed tersedia
- File PDF tersedia di app/documents/
"""

from __future__ import annotations

from pathlib import Path

from app.services.preprocessing import preprocess_document
from app.services.embedding import DocumentEmbedder

from .client import ChromaConnectionError, get_chroma_client
from .models import SearchResults, StoredDocument
from .pipeline import vectorstore_pipeline
from .store import DEFAULT_COLLECTION, VectorStore


# ======================================================================
# CONFIGURATION
# ======================================================================

DOCUMENT_ID = "test-document-001"

FILEPATH = (
    Path(__file__).resolve().parents[2]
    / "documents"
    / "AI_Knowledge_Base_Project_Proposal.pdf"
)


# ======================================================================
# HELPER
# ======================================================================

def print_header(title: str) -> None:
    print()
    print("=" * 70)
    print(title)
    print("=" * 70)


def stop_test(message: str) -> None:
    print()
    print(f"TEST STOPPED: {message}")


# ======================================================================
# 1. CHROMADB CONNECTION
# ======================================================================

def test_connection() -> bool:
    print_header("1. CHROMADB CONNECTION")

    try:
        client = get_chroma_client()

        heartbeat = client.heartbeat()

        print("ChromaDB       : OK")
        print(f"Heartbeat      : {heartbeat}")

        return True

    except ChromaConnectionError as exc:
        print("ChromaDB       : FAILED")
        print(f"Error          : {exc}")

        return False

    except Exception as exc:
        print("ChromaDB       : FAILED")
        print(f"Unexpected     : {exc}")

        return False


# ======================================================================
# 2. PREPROCESSING
# ======================================================================

def test_preprocessing():
    print_header("2. PREPROCESSING")

    print(f"File           : {FILEPATH}")

    if not FILEPATH.exists():
        print(f"ERROR          : File tidak ditemukan: {FILEPATH}")
        return None

    try:
        processed = preprocess_document(str(FILEPATH))

    except Exception as exc:
        print(f"ERROR          : {exc}")
        return None

    if not processed.success:
        print(f"ERROR          : {processed.error}")
        return None

    # ID sementara untuk integration test.
    #
    # Dalam aplikasi sebenarnya ID ini sebaiknya berasal
    # dari database PostgreSQL.
    processed.document_id = DOCUMENT_ID

    print(f"Document ID    : {processed.document_id}")
    print(f"Filename       : {processed.metadata.filename}")
    print(f"File Type      : {processed.metadata.file_type}")
    print(f"Segments       : {processed.num_segments}")
    print(f"Chunks         : {processed.num_chunks}")

    return processed


# ======================================================================
# 3. EMBEDDING
# ======================================================================

def test_embedding(processed):
    print_header("3. EMBEDDING")

    try:
        embedder = DocumentEmbedder()

        embedded = embedder.embed(processed)

    except Exception as exc:
        print(f"ERROR          : {exc}")
        return None

    if not embedded.success:
        print(f"ERROR          : {embedded.error}")
        return None

    print(f"Document ID    : {embedded.document_id}")
    print(f"Chunks         : {embedded.num_chunks}")

    if not embedded.embedded_chunks:
        print("ERROR          : Tidak ada embedded chunks.")
        return None

    first_chunk = embedded.embedded_chunks[0]

    print()
    print("FIRST EMBEDDED CHUNK")
    print("-" * 70)

    print(f"Chunk ID        : {first_chunk.chunk_id}")
    print(f"Segment Index   : {first_chunk.segment_index}")
    print(f"Text Preview    : {first_chunk.text[:150]}...")
    print(f"Vector Length   : {len(first_chunk.embedding)}")

    print()
    print("First 5 values  :")

    for value in first_chunk.embedding[:5]:
        print(f"  {value:.6f}")

    return embedded


# ======================================================================
# 4. VECTOR STORE
# ======================================================================

def test_store(embedded) -> StoredDocument | None:
    print_header("4. VECTOR STORE")

    stored = vectorstore_pipeline(
        document=embedded,
        collection_name=DEFAULT_COLLECTION,
    )

    if not stored.success:
        print(f"ERROR          : {stored.error}")
        return None

    print("Status         : STORED")
    print(f"Document ID    : {stored.document_id}")
    print(f"Collection     : {stored.collection_name}")
    print(f"Chunks stored  : {stored.num_chunks}")

    return stored


# ======================================================================
# 5. SIMILARITY SEARCH
# ======================================================================

def test_search(embedded) -> SearchResults | None:
    print_header("5. SIMILARITY SEARCH")

    try:
        client = get_chroma_client()

        store = VectorStore(
            client=client,
            collection_name=DEFAULT_COLLECTION,
        )

    except Exception as exc:
        print(f"ERROR          : {exc}")
        return None

    if not embedded.embedded_chunks:
        print("ERROR          : Tidak ada embedding untuk query.")
        return None

    # Untuk test, gunakan embedding chunk pertama sebagai query.
    #
    # Dalam aplikasi sebenarnya:
    #
    # user query
    #      ↓
    # "query: ..."
    #      ↓
    # embedding model
    #      ↓
    # query_embedding
    #      ↓
    # ChromaDB
    #
    query_embedding = embedded.embedded_chunks[0].embedding

    results = store.search(
        query_embedding=query_embedding,
        n_results=3,
    )

    if not results.success:
        print(f"ERROR          : {results.error}")
        return None

    print(f"Results        : {results.num_results}")

    for index, result in enumerate(
        results.results,
        start=1,
    ):
        print()
        print(f"Result #{index}")
        print("-" * 70)

        print(f"Chunk ID       : {result.chunk_id}")
        print(f"Document ID    : {result.document_id}")
        print(f"Distance       : {result.distance:.6f}")
        print(f"Text           : {result.text[:150]}...")

    return results


# ======================================================================
# 6. DELETE
# ======================================================================

def test_delete(stored: StoredDocument) -> bool:
    print_header("6. DELETE")

    try:
        client = get_chroma_client()

        store = VectorStore(
            client=client,
            collection_name=stored.collection_name,
        )

    except Exception as exc:
        print(f"ERROR          : {exc}")
        return False

    deleted = store.delete_chunks(stored.chunk_ids)

    if not deleted:
        print("Status         : FAILED")
        return False

    print("Status         : DELETED")
    print(f"Chunks deleted : {len(stored.chunk_ids)}")

    return True


# ======================================================================
# MAIN
# ======================================================================

def main() -> None:

    print()
    print("=" * 70)
    print("VECTOR STORE INTEGRATION TEST")
    print("=" * 70)

    # ------------------------------------------------------------------
    # 1. ChromaDB connection
    # ------------------------------------------------------------------

    if not test_connection():
        stop_test("ChromaDB tidak dapat diakses.")
        return

    # ------------------------------------------------------------------
    # 2. Preprocessing
    # ------------------------------------------------------------------

    processed = test_preprocessing()

    if processed is None:
        stop_test("preprocessing gagal.")
        return

    # ------------------------------------------------------------------
    # 3. Embedding
    # ------------------------------------------------------------------

    embedded = test_embedding(processed)

    if embedded is None:
        stop_test("embedding gagal.")
        return

    # ------------------------------------------------------------------
    # 4. Store
    # ------------------------------------------------------------------

    stored = test_store(embedded)

    if stored is None:
        stop_test("penyimpanan ke ChromaDB gagal.")
        return

    # ------------------------------------------------------------------
    # 5. Search
    # ------------------------------------------------------------------

    search_results = test_search(embedded)

    if search_results is None:
        stop_test("similarity search gagal.")
        return

    # ------------------------------------------------------------------
    # 6. Delete
    # ------------------------------------------------------------------

    deleted = test_delete(stored)

    if not deleted:
        stop_test("delete gagal.")
        return

    # ------------------------------------------------------------------
    # SUCCESS
    # ------------------------------------------------------------------

    print()
    print("=" * 70)
    print("ALL VECTOR STORE TESTS PASSED")
    print("=" * 70)


if __name__ == "__main__":
    main()