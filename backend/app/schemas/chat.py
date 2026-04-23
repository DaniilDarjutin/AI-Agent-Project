from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel
from app.schemas.llm_result import TaskEntities

class ChatRequest(SQLModel):
    chat_id: str
    message: str

class ChatResponse(SQLModel):
    reply: str
    action: Optional[str] = None
    requires_confirmation: bool = False
    entities: Optional[TaskEntities] = None


class ChatMessageRead(SQLModel):
    id: int
    chat_id: str
    role: str
    content: str
    created_at: datetime
