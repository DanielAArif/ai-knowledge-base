from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# ==========================================
# CHAT MESSAGE SCHEMAS
# ==========================================

class ChatMessageBase(BaseModel):
    role: str  # "user" / "assistant"
    content: str
    metadata: Optional[Dict[str, Any]] = Field(default=None, alias="msg_metadata")

    model_config = {
        "from_attributes": True,
        "populate_by_name": True  # Mengizinkan pemanggilan via nama 'metadata' maupun 'msg_metadata'
    }

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
    title: Optional[str] = "New Chat"
    document_id: Optional[int] = None  # None = Global Chatbot

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSessionResponse(ChatSessionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages: List[ChatMessageResponse] = []

    model_config = {"from_attributes": True}