"""
client.py
Client connection untuk ChromaDB.

ChromaDB berjalan sebagai service Docker terpisah.
Backend mengaksesnya melalui hostname Docker "chromadb".
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache

import chromadb
from chromadb.api import ClientAPI

logger = logging.getLogger(__name__)

DEFAULT_CHROMA_HOST = "chromadb"
DEFAULT_CHROMA_PORT = 8000


class ChromaConnectionError(RuntimeError):
    """Dilempar ketika client gagal terhubung ke ChromaDB."""


def _get_env_port(var_name: str, default: int) -> int:
    """
    Mengambil environment variable sebagai integer.

    Memberikan error yang jelas jika nilai bukan port yang valid.
    """

    raw = os.getenv(var_name)

    if raw is None or raw.strip() == "":
        return default

    try:
        port = int(raw)
    except ValueError as exc:
        raise ChromaConnectionError(
            f"Env var {var_name}='{raw}' bukan angka port yang valid."
        ) from exc

    if not 1 <= port <= 65535:
        raise ChromaConnectionError(
            f"Env var {var_name}='{raw}' berada di luar range port 1-65535."
        )

    return port


@lru_cache(maxsize=1)
def get_chroma_client() -> ClientAPI:
    """
    Membuat dan meng-cache HTTP client ke ChromaDB.

    Client hanya dibuat satu kali selama lifecycle aplikasi.

    Environment variables:
        CHROMA_HOST
            Default: chromadb

        CHROMA_PORT
            Default: 8000

        CHROMA_SSL
            Default: false

    Raises:
        ChromaConnectionError:
            Jika ChromaDB tidak dapat dihubungi.
    """

    host = os.getenv(
        "CHROMA_HOST",
        DEFAULT_CHROMA_HOST,
    ).strip()

    port = _get_env_port(
        "CHROMA_PORT",
        DEFAULT_CHROMA_PORT,
    )

    use_ssl = (
        os.getenv("CHROMA_SSL", "false")
        .strip()
        .lower()
        in {"true", "1", "yes"}
    )

    if not host:
        raise ChromaConnectionError(
            "CHROMA_HOST tidak boleh kosong."
        )

    try:
        client = chromadb.HttpClient(
            host=host,
            port=port,
            ssl=use_ssl,
        )

        # Pastikan ChromaDB benar-benar dapat diakses.
        client.heartbeat()

    except Exception as exc:
        logger.error(
            "Gagal terhubung ke ChromaDB di %s:%s: %s",
            host,
            port,
            exc,
        )

        protocol = "https" if use_ssl else "http"

        raise ChromaConnectionError(
            f"Tidak bisa terhubung ke ChromaDB di "
            f"{protocol}://{host}:{port}. "
            f"Pastikan service ChromaDB berjalan "
            f"dan backend berada pada Docker network yang sama."
        ) from exc

    logger.info(
        "Berhasil terhubung ke ChromaDB di %s:%s (ssl=%s)",
        host,
        port,
        use_ssl,
    )

    return client


def reset_chroma_client() -> None:
    """
    Menghapus client dari cache.

    Berguna untuk:
    - testing
    - reconnect manual
    - perubahan konfigurasi environment
    """

    get_chroma_client.cache_clear()