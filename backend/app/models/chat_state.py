from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field

class ChatState(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    chat_id: str = Field(index=True, unique=True)
    pending_action: Optional[str] = None
    pending_entities_json: Optional[str] = None
    awaiting_confirmation: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))