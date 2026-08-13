"""
service.py

Service untuk berinteraksi dengan LLM.

Modul ini hanya bertanggung jawab terhadap generation.
Retrieval dilakukan oleh vectorstore.
"""

from __future__ import annotations

import logging

from google import genai

from .models import LLMResponse

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "gemini-3.5-flash"


class LLMService:
    """
    Service untuk text generation menggunakan Gemini.
    """

    def __init__(
        self,
        client: genai.Client,
        model: str = DEFAULT_MODEL,
    ):
        self.client = client
        self.model = model

    def generate(
        self,
        prompt: str,
    ) -> LLMResponse:
        """
        Menghasilkan jawaban berdasarkan prompt.

        Prompt dapat berupa:
        - pertanyaan biasa
        - prompt RAG yang sudah berisi context
        """

        if not prompt or not prompt.strip():
            return LLMResponse(
                model=self.model,
                error="Prompt tidak boleh kosong.",
            )

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt.strip(),
            )

            answer = response.text or ""

            usage = getattr(
                response,
                "usage_metadata",
                None,
            )

            prompt_tokens = (
                getattr(
                    usage,
                    "prompt_token_count",
                    0,
                )
                or 0
            )

            completion_tokens = (
                getattr(
                    usage,
                    "candidates_token_count",
                    0,
                )
                or 0
            )

            total_tokens = (
                getattr(
                    usage,
                    "total_token_count",
                    0,
                )
                or 0
            )

            # Gemini SDK tidak selalu mengembalikan nama model yang
            # dipakai di response (beda dari OpenAI). Fallback ke
            # self.model kalau atributnya tidak ada.
            model = getattr(
                response,
                "model_version",
                self.model,
            )

            logger.info(
                "LLM generation berhasil "
                "(model='%s', tokens=%s).",
                model,
                total_tokens,
            )

            return LLMResponse(
                answer=answer,
                model=model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
            )

        except Exception as exc:
            logger.error(
                "Gagal menghasilkan response LLM "
                "(model='%s'): %s",
                self.model,
                exc,
            )

            return LLMResponse(
                model=self.model,
                error=(
                    f"Gagal menghasilkan response LLM: {exc}"
                ),
            )