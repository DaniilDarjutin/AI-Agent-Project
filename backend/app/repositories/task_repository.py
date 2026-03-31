from datetime import datetime, timezone
from typing import Sequence
from sqlmodel import Session, select
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate


class TaskRepository:
    def get_all(self, session: Session) -> Sequence[Task]:
        statement = select(Task)
        return session.exec(statement).all()

    def get_by_id(self, session: Session, task_id: int) -> Task | None:
        return session.get(Task, task_id)

    def create(self, session: Session, task_data: TaskCreate) -> Task:
        task = Task(**task_data.model_dump())
        session.add(task)
        session.commit()
        session.refresh(task)
        return task

    def update(self, session: Session, task: Task, task_data: TaskUpdate) -> Task:
        update_data = task_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(task, field, value)

        task.updated_at = datetime.now(timezone.utc)

        session.add(task)
        session.commit()
        session.refresh(task)
        return task

    def delete(self, session: Session, task: Task) -> None:
        session.delete(task)
        session.commit()