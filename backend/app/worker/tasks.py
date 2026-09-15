from app.database import SessionLocal
from app.services.embedding.dependencies import get_embedder
from app.services.vectorstore.dependencies import get_vector_store
from app.services.document.indexing import index_document
from app.models import Document

from .celery_app import celery_app


@celery_app.task(
    bind=True,
    name="documents.index_document"
)
def index_document_task(self, document_id: int):
    db = SessionLocal()

    try:
        document = (
            db.query(Document)
            .filter(Document.id == document_id)
            .first()
        )

        if document is None:
            raise ValueError(
                f"Document {document_id} tidak ditemukan."
            )

        embedder = get_embedder()
        vector_store = get_vector_store()

        index_document(
            document=document,
            db=db,
            embedder=embedder,
            vector_store=vector_store,
        )

        return {
            "document_id": document_id,
            "status": "completed",
        }

    except Exception:
        raise

    finally:
        db.close()
