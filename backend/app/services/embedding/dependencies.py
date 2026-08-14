"""
dependencies.py

Factory singleton untuk DocumentEmbedder, supaya model embedding
tidak dimuat ulang di setiap request/pemanggilan.
"""

from __future__ import annotations

from functools import lru_cache

from .embedder import DocumentEmbedder


@lru_cache(maxsize=1)
def get_embedder() -> DocumentEmbedder:
    return DocumentEmbedder()


def reset_embedder() -> None:
    """
    Membersihkan cache DocumentEmbedder. Berguna untuk testing.
    """

    get_embedder.cache_clear()