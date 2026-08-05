"""
cleaner.py
Tahap ketiga pipeline: extractor -> metadata -> cleaner -> chunker

Menerima ProcessedDocument yang sudah punya metadata (dari metadata.py),
membersihkan full_text & segments-nya, lalu mengembalikan ProcessedDocument
baru lewat with_text() - metadata TIDAK berubah, hanya teksnya.

Operasi yang dilakukan, berurutan:
    1. Normalisasi unicode (NFKC)
    2. Hapus karakter kontrol/non-printable
    3. Perbaiki kata terpotong hyphenation ("docu-\\nment" -> "document"),
       umum terjadi pada hasil ekstraksi PDF
    4. Buang baris "sampah" (nomor halaman berdiri sendiri, "Page X of Y")
    5. Rapikan whitespace berlebih

Dependencies: stdlib saja (re, unicodedata).
"""

from __future__ import annotations

import re
import unicodedata

from .models import DocumentSegment, ProcessedDocument

# Baris yang isinya cuma angka -> biasanya nomor halaman berdiri sendiri
_PAGE_NUMBER_LINE = re.compile(r"^\d{1,4}$")

# "Page 3 of 10" / "Halaman 3 dari 10"
_PAGE_LABEL_LINE = re.compile(
    r"^(page|halaman)\s+\d+\s+(of|dari)\s+\d+$", re.IGNORECASE
)

# Kata terpotong hyphenation di akhir baris, mis. "docu-\nment" -> "document"
_HYPHEN_LINEBREAK = re.compile(r"(\w)-\n(\w)")

# 3+ newline berturut-turut -> collapse jadi 1 baris kosong (2 newline)
_MULTI_NEWLINE = re.compile(r"\n{3,}")

# 2+ spasi/tab berturut-turut (bukan newline) -> collapse jadi 1 spasi
_MULTI_SPACE = re.compile(r"[ \t]{2,}")

# Karakter kontrol non-printable, kecuali \n dan \t
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def _normalize_unicode(text: str) -> str:
    return unicodedata.normalize("NFKC", text)


def _remove_control_chars(text: str) -> str:
    return _CONTROL_CHARS.sub("", text)


def _fix_hyphenation(text: str) -> str:
    return _HYPHEN_LINEBREAK.sub(r"\1\2", text)


def _remove_noise_lines(text: str) -> str:
    kept = []
    for line in text.split("\n"):
        stripped = line.strip()
        if _PAGE_NUMBER_LINE.match(stripped) or _PAGE_LABEL_LINE.match(stripped):
            continue
        kept.append(line)
    return "\n".join(kept)


def _collapse_whitespace(text: str) -> str:
    text = _MULTI_SPACE.sub(" ", text)
    text = _MULTI_NEWLINE.sub("\n\n", text)
    return text


def _strip_each_line(text: str) -> str:
    return "\n".join(line.strip() for line in text.split("\n"))


def clean_text(text: str) -> str:
    """
    Pipeline pembersihan untuk satu blok teks (satu segmen).

    Urutan penting: perbaikan hyphenation HARUS sebelum baris di-strip
    satu-satu, karena polanya bergantung pada newline literal yang
    menyambung dua baris.
    """
    if not text:
        return ""

    text = _normalize_unicode(text)
    text = _remove_control_chars(text)
    text = _fix_hyphenation(text)
    text = _remove_noise_lines(text)
    text = _collapse_whitespace(text)
    text = _strip_each_line(text)

    return text.strip()


def clean_document(doc: ProcessedDocument) -> ProcessedDocument:
    """
    Entry point utama, dipanggil dari pipeline.py setelah build_metadata().

    Contoh pemakaian:

        doc = extract_document(filepath)
        doc = build_metadata(filepath, doc)
        doc = clean_document(doc)
        chunks = chunk_document(doc)   # -> chunker.py, metadata.filename dkk masih ada
    """
    if not doc.success:
        return doc

    cleaned_segments = [
        DocumentSegment(index=seg.index, text=clean_text(seg.text))
        for seg in doc.segments
    ]

    # Segmen yang jadi kosong setelah dibersihkan (mis. cuma berisi nomor
    # halaman) dibuang, supaya tidak ikut ke tahap chunking/embedding.
    cleaned_segments = [seg for seg in cleaned_segments if seg.text]

    full_text = "\n\n".join(seg.text for seg in cleaned_segments)

    # with_text() mengembalikan ProcessedDocument baru dengan metadata
    # yang SAMA (tidak hilang) - cuma full_text & segments yang berubah.
    return doc.with_text(full_text, cleaned_segments)


if __name__ == "__main__":
    sample = (
        "Ini contoh   teks  dengan    spasi berlebih.\n\n\n\n"
        "Kata yang terpu-\ntus karena hyphenation.\n"
        "42\n"
        "Page 3 of 10\n"
        "Paragraf lanjutan setelah noise dibuang."
    )
    print(clean_text(sample))