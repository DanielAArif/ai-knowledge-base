"""
test_search.py

Integration test untuk semantic search.

Prasyarat:
- ChromaDB berjalan.
- Collection knowledge_base sudah memiliki data.
- FastEmbed tersedia.
"""

from __future__ import annotations

from app.services.embedding import DocumentEmbedder

from .client import get_chroma_client
from .models import SearchResults
from .search import semantic_search
from .store import DEFAULT_COLLECTION, VectorStore


def print_header(title: str) -> None:
    print()
    print("=" * 70)
    print(title)
    print("=" * 70)


def main() -> None:

    print_header("SEMANTIC SEARCH TEST")

    query = "Apa saja fitur yang tersedia dalam AI Knowledge Base?"

    print(f"Query          : {query}")
    print(f"Collection     : {DEFAULT_COLLECTION}")
    print("Top K          : 3")

    # --------------------------------------------------------------
    # 1. Check ChromaDB
    # --------------------------------------------------------------

    print_header("1. CHROMADB CONNECTION")

    try:
        client = get_chroma_client()

        print("ChromaDB       : OK")
        print(f"Heartbeat      : {client.heartbeat()}")

    except Exception as exc:
        print(f"ERROR          : {exc}")
        return

    # --------------------------------------------------------------
    # 2. Query embedding
    # --------------------------------------------------------------

    print_header("2. QUERY EMBEDDING")

    try:
        embedder = DocumentEmbedder()

        query_embedding = embedder.embed_query(
            query
        )

        print("Status         : OK")
        print(f"Vector Length  : {len(query_embedding)}")

        print()
        print("First 5 values :")

        for value in query_embedding[:5]:
            print(f"  {value:.6f}")

    except Exception as exc:
        print(f"ERROR          : {exc}")
        return

    # --------------------------------------------------------------
    # 3. Vector search
    # --------------------------------------------------------------

    print_header("3. VECTOR SEARCH")

    results: SearchResults = semantic_search(
        query=query,
        n_results=3,
        collection_name=DEFAULT_COLLECTION,
        embedder=embedder,
    )

    if not results.success:
        print(f"ERROR          : {results.error}")
        return

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
        print(f"Text           : {result.text[:300]}...")

    # --------------------------------------------------------------
    # SUCCESS
    # --------------------------------------------------------------

    print()
    print("=" * 70)
    print("SEMANTIC SEARCH TEST PASSED")
    print("=" * 70)


if __name__ == "__main__":
    main()