from typing import Optional
from sqlmodel import SQLModel
from app.utils.enums import TaskPriority, TaskStatus

class TaskChanges(SQLModel):
    new_title: Optional[str] = None
    new_description: Optional[str] = None
    new_status: Optional[TaskStatus] = None
    new_priority: Optional[TaskPriority] = None
    new_due_date: Optional[str] = None

class TaskEntities(SQLModel):
    task_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[str] = None
    changes: Optional[TaskChanges] = None

class LLMResult(SQLModel):
    intent: str
    is_task_related: bool
    requires_confirmation: bool
    reply: str
    entities: TaskEntities = TaskEntities()