"""
check_llm.py

Manual integration check untuk LLM service menggunakan Gemini.

PENTING:
Script ini melakukan request nyata ke Gemini API.
Gunakan hanya saat perlu melakukan verifikasi integration.

Jalankan:

python -m app.services.llm.check_llm

Yang diperiksa:

1. Gemini client berhasil dibuat.
2. LLMService berhasil dibuat.
3. Generation berhasil.
4. Response memiliki answer.
5. Model terdeteksi.
6. Token usage tersedia jika disediakan oleh API.
7. Prompt kosong ditangani dengan benar.
"""

from __future__ import annotations

import sys

from .client import get_llm_client, reset_llm_client
from .service import LLMService


SEPARATOR = "=" * 70


def check_connection() -> bool:
    """
    Menguji inisialisasi Gemini client.
    """

    print()
    print(SEPARATOR)
    print("1. GEMINI CONNECTION")
    print(SEPARATOR)

    try:
        reset_llm_client()

        get_llm_client()

        print("Gemini Client : OK")

        return True

    except Exception as exc:
        print("Gemini Client : FAILED")
        print(f"Error         : {exc}")

        return False


def check_generation() -> bool:
    """
    Menguji text generation menggunakan LLMService.
    """

    print()
    print(SEPARATOR)
    print("2. LLM GENERATION")
    print(SEPARATOR)

    try:
        client = get_llm_client()

        service = LLMService(
            client=client,
        )

        prompt = (
            "Jelaskan secara singkat apa itu "
            "AI Knowledge Base dalam bahasa Indonesia."
        )

        print(f"Model         : {service.model}")
        print(f"Prompt        : {prompt}")
        print()
        print("Generating response...")

        response = service.generate(prompt)

        if not response.success:
            print("Generation    : FAILED")
            print(f"Error         : {response.error}")

            return False

        if not response.answer or not response.answer.strip():
            print("Generation    : FAILED")
            print("Error         : Response kosong.")

            return False

        print("Generation    : OK")
        print()
        print("Answer:")
        print("-" * 70)
        print(response.answer)
        print("-" * 70)

        print()
        print(f"Response Model     : {response.model}")
        print(f"Prompt Tokens      : {response.prompt_tokens}")
        print(f"Completion Tokens  : {response.completion_tokens}")
        print(f"Total Tokens       : {response.total_tokens}")

        return True

    except Exception as exc:
        print("Generation    : FAILED")
        print(f"Error         : {exc}")

        return False


def check_empty_prompt() -> bool:
    """
    Menguji validasi prompt kosong.

    Tidak memanggil Gemini API.
    """

    print()
    print(SEPARATOR)
    print("3. EMPTY PROMPT VALIDATION")
    print(SEPARATOR)

    try:
        client = get_llm_client()

        service = LLMService(
            client=client,
        )

        response = service.generate("")

        if response.success:
            print("Validation    : FAILED")
            print("Error         : Prompt kosong seharusnya ditolak.")

            return False

        print("Validation    : OK")
        print(f"Error         : {response.error}")

        return True

    except Exception as exc:
        print("Validation    : FAILED")
        print(f"Error         : {exc}")

        return False


def main() -> None:
    """
    Menjalankan seluruh manual check.
    """

    print()
    print(SEPARATOR)
    print("GEMINI LLM INTEGRATION CHECK")
    print(SEPARATOR)

    results: list[bool] = []

    # ----------------------------------------------------------
    # 1. Connection
    # ----------------------------------------------------------

    connection_ok = check_connection()
    results.append(connection_ok)

    if not connection_ok:
        print()
        print(SEPARATOR)
        print("CHECK STOPPED")
        print(SEPARATOR)

        sys.exit(1)

    # ----------------------------------------------------------
    # 2. Generation
    # ----------------------------------------------------------

    generation_ok = check_generation()
    results.append(generation_ok)

    # ----------------------------------------------------------
    # 3. Empty prompt
    # ----------------------------------------------------------

    validation_ok = check_empty_prompt()
    results.append(validation_ok)

    # ----------------------------------------------------------
    # Final result
    # ----------------------------------------------------------

    print()
    print(SEPARATOR)
    print("CHECK SUMMARY")
    print(SEPARATOR)

    print(f"Connection : {'PASS' if connection_ok else 'FAIL'}")
    print(f"Generation : {'PASS' if generation_ok else 'FAIL'}")
    print(f"Validation : {'PASS' if validation_ok else 'FAIL'}")

    print()

    if all(results):
        print("GEMINI LLM CHECK PASSED")
    else:
        print("GEMINI LLM CHECK FAILED")

    print(SEPARATOR)

    sys.exit(0 if all(results) else 1)


if __name__ == "__main__":
    main()