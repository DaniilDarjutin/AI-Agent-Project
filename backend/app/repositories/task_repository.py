from datetime import datetime, timezone
from typing import Sequence
from sqlalchemy import func, or_
from sqlmodel import Session, select
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

class TaskRepository:
    def get_all(self, session: Session) -> Sequence[Task]:
        statement = select(Task)
        return session.exec(statement).all()

    def get_by_id(self, session: Session, task_id: int) -> Task | None:
        return session.get(Task, task_id)

    def get_by_title(self, session: Session, title: str) -> Task | None:
        statement = select(Task).where(func.lower(Task.title) == title.lower())
        return session.exec(statement).first()

    def search_by_title(self, session: Session, title: str) -> Task | None:
        stop_words = {"в", "на", "и", "с", "по", "к", "из", "за", "до", "для"}

        words = [
            word.strip().lower()
            for word in title.split()
            if word.strip() and word.strip().lower() not in stop_words
        ]

        if not words:
            return None

        conditions = [func.lower(Task.title).like(f"%{word}%") for word in words]

        statement = select(Task).where(or_(*conditions))
        results = session.exec(statement).all()

        if not results:
            return None

        return results[0]

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