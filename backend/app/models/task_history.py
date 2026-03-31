from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field

class TaskHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int
    action_type: str
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))