from typing import Sequence
from fastapi import HTTPException
from sqlmodel import Session
from app.models.task import Task
from app.repositories.task_repository import TaskRepository
from app.schemas.task import TaskCreate, TaskUpdate
from app.utils.exceptions import AmbiguousTaskMatchError

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

    def get_task_by_title(self, session: Session, title: str) -> Task:
        task = self.task_repository.get_by_title(session, title)

        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")

        return task

    def search_tasks_by_title(self, session: Session, title: str) -> list[Task]:
        all_tasks = list(self.task_repository.get_all(session))

        query_tokens = self._tokenize(title)
        if not query_tokens:
            return []

        exact_matches = [
            task for task in all_tasks
            if task.title.strip().lower() == title.strip().lower()
        ]

        if len(exact_matches) == 1:
            return exact_matches

        if len(exact_matches) > 1:
            return exact_matches

        scored_tasks: list[tuple[int, Task]] = []

        for task in all_tasks:
            task_tokens = self._tokenize(task.title)
            overlap = len(set(query_tokens) & set(task_tokens))

            if overlap > 0:
                scored_tasks.append((overlap, task))

        scored_tasks.sort(key=lambda item: (-item[0], len(item[1].title)))
        return [task for _, task in scored_tasks]

    def resolve_task_by_title(self, session: Session, title: str) -> Task:
        matches = self.search_tasks_by_title(session, title)

        if not matches:
            raise HTTPException(status_code=404, detail="Task not found")

        if len(matches) > 1:
            raise AmbiguousTaskMatchError(matches)

        return matches[0]

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

    def _tokenize(self, text: str) -> list[str]:
        stop_words = {"в", "на", "и", "с", "по", "к", "из", "за", "до", "для"}

        return [
            word.strip().lower()
            for word in text.split()
            if word.strip() and word.strip().lower() not in stop_words
        ]