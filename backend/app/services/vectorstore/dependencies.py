"""
dependencies.py

Factory singleton untuk VectorStore (collection default), supaya
instance yang sama dipakai di berbagai bagian aplikasi (upload,
RAG, dsb) tanpa membangun koneksi/collection berulang kali.
"""

from __future__ import annotations

from functools import lru_cache

from .client import get_chroma_client
from .store import DEFAULT_COLLECTION, VectorStore


@lru_cache(maxsize=1)
def get_vector_store() -> VectorStore:
    return VectorStore(
        client=get_chroma_client(),
        collection_name=DEFAULT_COLLECTION,
    )


def reset_vector_store() -> None:
    """
    Membersihkan cache VectorStore. Berguna untuk testing.
    """

    get_vector_store.cache_clear()