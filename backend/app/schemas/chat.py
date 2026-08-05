from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Chat Message Schemas
class ChatMessageBase(BaseModel):
    sender: str
    content: str

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: int
    session_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

# Chat Session Schemas
class ChatSessionBase(BaseModel):
    title: Optional[str] = "New Chat"

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSessionResponse(ChatSessionBase):
    id: int
    user_id: int
    created_at: datetime
    messages: List[ChatMessageResponse] = []

    model_config = {"from_attributes": True}