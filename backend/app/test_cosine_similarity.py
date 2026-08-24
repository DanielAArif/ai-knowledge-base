"""
test_cosine_similarity.py

Pengujian cosine similarity antara query dan seluruh chunk dokumen.

Tujuan:
- Memastikan embedding query dan embedding chunk dapat dibandingkan.
- Melihat ranking chunk berdasarkan cosine similarity.
- Membantu mendiagnosis masalah retrieval RAG.

Jalankan dari root project:

    python -m app.test_cosine_similarity
"""

from __future__ import annotations

import numpy as np

from app.services.embedding.embedder import DocumentEmbedder
from app.services.preprocessing.pipeline import preprocess_document
from app.services.embedding.pipeline import embedding_pipeline


FILE_PATH = "app/documents/Sistem Pencernaan Manusia.docx"


QUERIES = [
    "Apa itu obesitas?",
    "Sebutkan macam gangguan pencernaan",
]


def cosine_similarity(
    vector_a: list[float] | np.ndarray,
    vector_b: list[float] | np.ndarray,
) -> float:
    """
    Menghitung cosine similarity antara dua vector.

    Nilai:
        1.0  -> sangat mirip
        0.0  -> tidak memiliki kemiripan arah
        -1.0 -> berlawanan arah
    """

    a = np.asarray(vector_a, dtype=np.float32)
    b = np.asarray(vector_b, dtype=np.float32)

    denominator = np.linalg.norm(a) * np.linalg.norm(b)

    if denominator == 0:
        return 0.0

    return float(np.dot(a, b) / denominator)


def main() -> None:
    print("=" * 80)
    print("COSINE SIMILARITY TEST")
    print("=" * 80)

    # ==============================================================
    # 1. PREPROCESSING
    # ==============================================================

    print()
    print("=" * 80)
    print("1. PREPROCESSING")
    print("=" * 80)

    print(f"File: {FILE_PATH}")

    processed_doc = preprocess_document(FILE_PATH)

    print(f"Success  : {processed_doc.success}")
    print(f"Segments : {processed_doc.num_segments}")
    print(f"Chunks   : {processed_doc.num_chunks}")

    if not processed_doc.success:
        print(f"Error    : {processed_doc.error}")
        return

    # ==============================================================
    # 2. EMBEDDING
    # ==============================================================

    print()
    print("=" * 80)
    print("2. EMBEDDING")
    print("=" * 80)

    embedded_doc = embedding_pipeline(processed_doc)

    print(f"Success : {embedded_doc.success}")
    print(f"Chunks  : {embedded_doc.num_chunks}")

    if not embedded_doc.success:
        print(f"Error   : {embedded_doc.error}")
        return

    if not embedded_doc.embedded_chunks:
        print("Tidak ada embedded chunks.")
        return

    first_vector = embedded_doc.embedded_chunks[0].embedding

    print(f"Dimension : {len(first_vector)}")

    # ==============================================================
    # 3. INITIALIZE EMBEDDER
    # ==============================================================

    print()
    print("=" * 80)
    print("3. INITIALIZE QUERY EMBEDDER")
    print("=" * 80)

    embedder = DocumentEmbedder()

    print(f"Model : {embedder.model_name}")

    # ==============================================================
    # 4. COSINE SIMILARITY
    # ==============================================================

    for query in QUERIES:

        print()
        print("=" * 80)
        print("QUERY")
        print("=" * 80)

        print(query)

        print()
        print("-" * 80)
        print("CALCULATING COSINE SIMILARITY")
        print("-" * 80)

        # ----------------------------------------------------------
        # Query embedding
        # ----------------------------------------------------------

        query_embedding = embedder.embed_query(query)

        print(
            f"Query embedding dimension : "
            f"{len(query_embedding)}"
        )

        # ----------------------------------------------------------
        # Hitung similarity terhadap seluruh chunk
        # ----------------------------------------------------------

        results: list[
            tuple[float, int, str]
        ] = []

        for chunk in embedded_doc.embedded_chunks:

            similarity = cosine_similarity(
                query_embedding,
                chunk.embedding,
            )

            results.append(
                (
                    similarity,
                    chunk.chunk_id,
                    chunk.text,
                )
            )

        # ----------------------------------------------------------
        # Sort:
        # cosine similarity terbesar = paling relevan
        # ----------------------------------------------------------

        results.sort(
            key=lambda item: item[0],
            reverse=True,
        )

        # ==========================================================
        # 5. DISPLAY RESULTS
        # ==========================================================

        print()
        print("-" * 80)
        print("TOP 10 CHUNKS")
        print("-" * 80)

        for rank, (
            similarity,
            chunk_id,
            text,
        ) in enumerate(results[:10], start=1):

            preview = (
                text.replace("\n", " ").strip()
            )

            if len(preview) > 250:
                preview = preview[:250] + "..."

            print()
            print(f"RANK       : {rank}")
            print(f"CHUNK ID   : {chunk_id}")
            print(f"SIMILARITY : {similarity:.6f}")
            print(f"TEXT       : {preview}")

        # ==========================================================
        # 6. SEARCH KEYWORD
        # ==========================================================

        keywords = [
            "obesitas",
            "diare",
            "gastritis",
            "mag",
            "konstipasi",
        ]

        print()
        print("-" * 80)
        print("KEYWORD CHUNK CHECK")
        print("-" * 80)

        found = False

        for keyword in keywords:

            keyword_results = [
                (
                    similarity,
                    chunk_id,
                    text,
                )
                for similarity, chunk_id, text in results
                if keyword.lower() in text.lower()
            ]

            if not keyword_results:
                print(
                    f"\n{keyword.upper():<15}: "
                    f"TIDAK DITEMUKAN"
                )
                continue

            found = True

            print()
            print(f"{keyword.upper()}: ")

            for similarity, chunk_id, text in keyword_results:

                preview = (
                    text.replace("\n", " ").strip()
                )

                if len(preview) > 200:
                    preview = preview[:200] + "..."

                # Cari ranking chunk tersebut
                rank = next(
                    index + 1
                    for index, item in enumerate(results)
                    if item[1] == chunk_id
                )

                print(
                    f"  Rank       : {rank}"
                )
                print(
                    f"  Chunk ID   : {chunk_id}"
                )
                print(
                    f"  Similarity : {similarity:.6f}"
                )
                print(
                    f"  Text       : {preview}"
                )

        if not found:
            print(
                "\nTidak ada keyword gangguan "
                "pencernaan yang ditemukan di chunks."
            )

    # ==============================================================
    # 7. FINISHED
    # ==============================================================

    print()
    print("=" * 80)
    print("COSINE SIMILARITY TEST SELESAI")
    print("=" * 80)


if __name__ == "__main__":
    main()