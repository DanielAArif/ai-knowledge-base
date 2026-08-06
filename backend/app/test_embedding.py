"""
test_embedding.py

Pengujian manual embedding pipeline.

Jalankan:

    python -m app.test_embedding
"""

from app.services.embedding.pipeline import embedding_pipeline
from app.services.preprocessing.pipeline import preprocess_document


FILE_PATH = "app/documents/AI_Knowledge_Base_Project_Proposal.pdf"


def main() -> None:
    print("=" * 70)
    print("PREPROCESSING")
    print("=" * 70)

    processed_doc = preprocess_document(FILE_PATH)

    print(f"Success : {processed_doc.success}")

    if processed_doc.error:
        print(f"Error   : {processed_doc.error}")
        return

    print(f"Segments : {processed_doc.num_segments}")
    print(f"Chunks   : {processed_doc.num_chunks}")

    print()

    print("=" * 70)
    print("EMBEDDING")
    print("=" * 70)

    embedded_doc = embedding_pipeline(processed_doc)

    print(f"Filename : {embedded_doc.metadata.filename}")
    print(f"Chunks   : {embedded_doc.num_chunks}")

    if embedded_doc.num_chunks == 0:
        print("\nTidak ada chunk yang berhasil di-embedding.")
        return

    first_chunk = embedded_doc.embedded_chunks[0]

    print()
    print("=" * 70)
    print("FIRST EMBEDDED CHUNK")
    print("=" * 70)

    print(f"Chunk ID      : {first_chunk.chunk_id}")
    print(f"Segment Index : {first_chunk.segment_index}")

    preview = (
        first_chunk.text[:200] + "..."
        if len(first_chunk.text) > 200
        else first_chunk.text
    )

    print(f"Text Preview  : {preview}")

    print(f"Vector Length : {len(first_chunk.embedding)}")

    print("\nFirst 10 Values:")

    for value in first_chunk.embedding[:10]:
        print(f"{value:.6f}")


if __name__ == "__main__":
    main()