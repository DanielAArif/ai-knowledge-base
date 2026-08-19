from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

# ==========================================
# CHAT MESSAGE SCHEMAS
# ==========================================

class ChatMessageBase(BaseModel):
    role: str  # "user" / "assistant"
    content: str
    metadata: Optional[Dict[str, Any]] = Field(default=None, alias="msg_metadata")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True  # Mengizinkan penggunaan 'metadata' maupun 'msg_metadata'
    )


class ChatMessageCreate(BaseModel):
    content: str  # User hanya mengirim content


class ChatMessageResponse(ChatMessageBase):
    id: int
    session_id: int
    created_at: datetime


# ==========================================
# CHAT SESSION SCHEMAS
# ==========================================

class ChatSessionBase(BaseModel):
    title: Optional[str] = Field(default="New Chat", examples=["New Chat"])
    document_id: Optional[int] = Field(
        default=None, 
        description="ID Dokumen spesifik. Biarkan null jika ingin Global Chatbot.",
        examples=[1]
    )


class ChatSessionCreate(ChatSessionBase):
    pass


class ChatSessionResponse(ChatSessionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages: List[ChatMessageResponse] = []

    model_config = ConfigDict(from_attributes=True)