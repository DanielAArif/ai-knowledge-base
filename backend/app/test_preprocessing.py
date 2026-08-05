"""
test_preprocessing.py

Pengujian manual seluruh pipeline preprocessing.

Jalankan:

    python -m app.test_preprocessing
"""

from app.services.preprocessing.pipeline import preprocess_document


FILE_PATH = "app/documents/AI_Knowledge_Base_Project_Proposal.pdf"


def main() -> None:
    doc = preprocess_document(FILE_PATH)

    print("=" * 70)
    print("STATUS")
    print("=" * 70)
    print(f"Success : {doc.success}")

    if doc.error:
        print(f"Error   : {doc.error}")
        return

    print()

    print("=" * 70)
    print("METADATA")
    print("=" * 70)
    print(f"Filename : {doc.metadata.filename}")
    print(f"File Type: {doc.metadata.file_type}")
    print(f"Title    : {doc.metadata.title}")
    print(f"Author   : {doc.metadata.author}")

    print()

    print("=" * 70)
    print("SEGMENTS")
    print("=" * 70)
    print(f"Jumlah Segment : {doc.num_segments}")
    print()

    for segment in doc.segments:
        print(f"[Segment {segment.index}]")
        print("-" * 70)
        print(segment.text[:300])

        if len(segment.text) > 300:
            print("...")

        print()

    print("=" * 70)
    print("CHUNKS")
    print("=" * 70)
    print(f"Jumlah Chunk : {doc.num_chunks}")
    print()

    for chunk in doc.chunks:
        print(
            f"[Chunk {chunk.chunk_id}] "
            f"(Segment {chunk.segment_index})"
        )
        print("-" * 70)
        print(chunk.text)
        print()


if __name__ == "__main__":
    main()