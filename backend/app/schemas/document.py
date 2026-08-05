from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.document import DocumentStatus

class DocumentBase(BaseModel):
    title: str
    category_id: Optional[int] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: int
    file_path: str
    file_type: str
    file_size: int
    status: DocumentStatus
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}