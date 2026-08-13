"""
models.py

Struktur data untuk LLM service.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class LLMResponse:
    """
    Hasil response dari LLM.

    Field sources disiapkan untuk kebutuhan RAG sehingga
    jawaban dapat ditelusuri kembali ke sumber dokumen.
    """

    answer: str = ""

    model: str = ""

    # Token usage dari LLM
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    # Sumber yang digunakan dalam RAG
    sources: list[dict[str, Any]] = field(
        default_factory=list
    )

    error: Optional[str] = None

    @property
    def success(self) -> bool:
        """
        Menentukan apakah request LLM berhasil.
        """

        return self.error is None