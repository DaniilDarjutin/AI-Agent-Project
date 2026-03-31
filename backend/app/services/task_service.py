from typing import Sequence
from fastapi import HTTPException
from sqlmodel import Session
from app.models.task import Task
from app.repositories.task_repository import TaskRepository
from app.schemas.task import TaskCreate, TaskUpdate


class TaskService:
    def __init__(self, task_repository: TaskRepository):
        self.task_repository = task_repository

    def get_all_tasks(self, session: Session) -> Sequence[Task]:
        return self.task_repository.get_all(session)

    def get_task_by_id(self, session: Session, task_id: int) -> Task:
        task = self.task_repository.get_by_id(session, task_id)

        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")

        return task

    def create_task(self, session: Session, task_data: TaskCreate) -> Task:
        return self.task_repository.create(session, task_data)

    def update_task(self, session: Session, task_id: int, task_data: TaskUpdate) -> Task:
        task = self.task_repository.get_by_id(session, task_id)

        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")

        return self.task_repository.update(session, task, task_data)

    def delete_task(self, session: Session, task_id: int) -> None:
        task = self.task_repository.get_by_id(session, task_id)

        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")

        self.task_repository.delete(session, task)