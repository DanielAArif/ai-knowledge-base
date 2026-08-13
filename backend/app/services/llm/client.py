"""
client.py

Client connection untuk Gemini API.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache

from google import genai

logger = logging.getLogger(__name__)


class LLMConnectionError(RuntimeError):
    """
    Dilempar ketika Gemini client gagal dibuat.
    """


@lru_cache(maxsize=1)
def get_llm_client() -> genai.Client:
    """
    Membuat dan meng-cache Gemini client.

    Environment variable:

        GEMINI_API_KEY
    """

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key or not api_key.strip():
        raise LLMConnectionError(
            "GEMINI_API_KEY belum dikonfigurasi."
        )

    try:
        client = genai.Client(
            api_key=api_key,
        )

    except Exception as exc:
        logger.error(
            "Gagal membuat Gemini client: %s",
            exc,
        )

        raise LLMConnectionError(
            f"Gagal menginisialisasi Gemini client: {exc}"
        ) from exc

    logger.info(
        "Gemini client berhasil diinisialisasi."
    )

    return client


def reset_llm_client() -> None:
    """
    Membersihkan cache Gemini client.

    Berguna untuk testing atau ketika konfigurasi
    environment berubah.
    """

    get_llm_client.cache_clear()