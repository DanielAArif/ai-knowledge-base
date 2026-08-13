"""
search.py

Query/search pipeline untuk vector store.

Alur:

User query
    ↓
FastEmbed
    ↓
Query embedding
    ↓
ChromaDB
    ↓
SearchResults
"""

from __future__ import annotations

from app.services.embedding import DocumentEmbedder

from .client import ChromaConnectionError, get_chroma_client
from .models import SearchResults
from .store import DEFAULT_COLLECTION, VectorStore


def semantic_search(
    query: str,
    n_results: int = 5,
    collection_name: str = DEFAULT_COLLECTION,
    embedder: DocumentEmbedder | None = None,
) -> SearchResults:
    """
    Melakukan semantic search berdasarkan teks query.

    Alur:

        query
          ↓
        FastEmbed
          ↓
        query embedding
          ↓
        ChromaDB
          ↓
        SearchResults
    """

    if not query or not query.strip():
        return SearchResults(
            error="Query tidak boleh kosong."
        )

    if n_results <= 0:
        return SearchResults(
            error="n_results harus lebih besar dari 0."
        )

    try:
        if embedder is None:
            embedder = DocumentEmbedder()

        query_embedding = embedder.embed_query(
            query
        )

        client = get_chroma_client()

        store = VectorStore(
            client=client,
            collection_name=collection_name,
        )

        return store.search(
            query_embedding=query_embedding,
            n_results=n_results,
        )

    except ChromaConnectionError as exc:
        return SearchResults(
            error=f"Gagal terhubung ke ChromaDB: {exc}"
        )

    except Exception as exc:
        return SearchResults(
            error=f"Gagal melakukan semantic search: {exc}"
        )