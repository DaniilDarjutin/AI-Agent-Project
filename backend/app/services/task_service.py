from typing import Sequence
from fastapi import HTTPException
from sqlmodel import Session
from app.models.task import Task
from app.repositories.task_history_repository import TaskHistoryRepository
from app.repositories.task_repository import TaskRepository
from app.models.task_history import TaskHistory
from app.schemas.task import TaskCreate, TaskUpdate
from app.utils.exceptions import AmbiguousTaskMatchError

class TaskService:
    QUERY_EXPANSIONS = {
        "программирование": {
            "программирование",
            "код",
            "разработка",
            "разработчик",
            "backend",
            "бэкенд",
            "frontend",
            "фронтенд",
            "api",
            "react",
            "python",
            "fastapi",
            "docker",
            "compose",
            "sql",
            "база",
            "сервер",
            "bug",
            "баг",
            "ошибка",
            "refactor",
            "рефакторинг",
            "deploy",
            "деплой",
            "тест",
            "тесты",
            "авторизация",
            "аутентификация",
            "auth",
            "логин",
            "страница",
            "ui",
            "ux",
            "история",
            "изменений",
            "history",
            "backend api",
            "docker compose",
        },
        "спорт": {
            "спорт",
            "тренировка",
            "зал",
            "бег",
            "пробежка",
            "бассейн",
            "футбол",
            "турник",
            "кардио",
        },
        "учеба": {
            "учеба",
            "учёба",
            "курс",
            "урок",
            "домашка",
            "экзамен",
            "лекция",
            "семинар",
            "конспект",
            "дз",
        },
    }

    def __init__(self, task_repository: TaskRepository):
        self.task_repository = task_repository
        self.task_history_repository = TaskHistoryRepository()

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

    def search_tasks_by_query(self, session: Session, query: str) -> list[Task]:
        normalized_query = query.strip().lower()
        if not normalized_query:
            return list(self.task_repository.get_all(session))

        expanded_terms = self._expand_query_terms(normalized_query)
        all_tasks = list(self.task_repository.get_all(session))
        scored_tasks: list[tuple[int, Task]] = []

        for task in all_tasks:
            score = self._score_task_relevance(task, expanded_terms, normalized_query)
            if score > 0:
                scored_tasks.append((score, task))

        scored_tasks.sort(
            key=lambda item: (
                -item[0],
                item[1].status.value != "in_progress",
                item[1].status.value != "todo",
                -(item[1].updated_at.timestamp() if item[1].updated_at else 0),
                item[1].id,
            )
        )
        return [task for _, task in scored_tasks]

    def resolve_task_by_title(self, session: Session, title: str) -> Task:
        matches = self.search_tasks_by_title(session, title)

        if not matches:
            raise HTTPException(status_code=404, detail="Task not found")

        if len(matches) > 1:
            raise AmbiguousTaskMatchError(matches)

        return matches[0]

    def create_task(self, session: Session, task_data: TaskCreate) -> Task:
        task = self.task_repository.create(session, task_data)
        self.task_history_repository.create(
            session,
            task_id=task.id,
            action_type="created",
            new_value=task.title,
        )
        return task

    def update_task(self, session: Session, task_id: int, task_data: TaskUpdate) -> Task:
        task = self.task_repository.get_by_id(session, task_id)

        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")

        before_update = self._snapshot_task(task)
        updated_task = self.task_repository.update(session, task, task_data)
        after_update = self._snapshot_task(updated_task)

        for field_name, old_value in before_update.items():
            new_value = after_update[field_name]

            if old_value == new_value:
                continue

            self.task_history_repository.create(
                session,
                task_id=updated_task.id,
                action_type="updated",
                field_name=field_name,
                old_value=old_value,
                new_value=new_value,
            )

        return updated_task

    def delete_task(self, session: Session, task_id: int) -> None:
        task = self.task_repository.get_by_id(session, task_id)

        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")

        self.task_history_repository.create(
            session,
            task_id=task.id,
            action_type="deleted",
            old_value=task.title,
        )
        self.task_repository.delete(session, task)

    def get_task_history(self, session: Session, task_id: int) -> Sequence[TaskHistory]:
        self.get_task_by_id(session, task_id)
        return self.task_history_repository.get_by_task_id(session, task_id)

    def _tokenize(self, text: str) -> list[str]:
        stop_words = {"в", "на", "и", "с", "по", "к", "из", "за", "до", "для"}

        return [
            word.strip().lower()
            for word in text.split()
            if word.strip() and word.strip().lower() not in stop_words
        ]

    def _expand_query_terms(self, query: str) -> set[str]:
        query_tokens = self._tokenize(query)
        expanded_terms = set(query_tokens)
        expanded_terms.add(query)

        for key, related_terms in self.QUERY_EXPANSIONS.items():
            if key == query or key in query_tokens or any(token in related_terms for token in query_tokens):
                expanded_terms.update(related_terms)

        return {term.lower() for term in expanded_terms if term.strip()}

    def _score_task_relevance(self, task: Task, terms: set[str], query: str) -> int:
        title = task.title.lower()
        description = (task.description or "").lower()
        combined_text = f"{title} {description}".strip()

        score = 0

        if query in title:
            score += 8

        if query in description:
            score += 5

        title_tokens = set(self._tokenize(task.title))
        description_tokens = set(self._tokenize(task.description or ""))

        for term in terms:
            if term in title_tokens:
                score += 4
            elif term in title:
                score += 3

            if term in description_tokens:
                score += 2
            elif term in description:
                score += 1

        if query and combined_text and all(token in combined_text for token in self._tokenize(query)):
            score += 4

        if self._looks_like_programming_query(query):
            score += self._score_technical_title(title)

        return score

    def _looks_like_programming_query(self, query: str) -> bool:
        query_tokens = set(self._tokenize(query))
        programming_terms = self.QUERY_EXPANSIONS["программирование"]

        return (
            query.strip().lower() == "программирование"
            or "программирование" in query_tokens
            or any(token in programming_terms for token in query_tokens)
        )

    def _score_technical_title(self, title: str) -> int:
        technical_markers = {
            "docker": 4,
            "compose": 3,
            "баг": 4,
            "ошибка": 4,
            "авториза": 3,
            "аутенти": 3,
            "логин": 2,
            "страниц": 2,
            "истори": 2,
            "изменен": 2,
            "api": 4,
            "backend": 4,
            "бэкенд": 4,
            "frontend": 4,
            "фронтенд": 4,
            "react": 4,
            "python": 4,
            "fastapi": 4,
            "sql": 3,
            "рефактор": 3,
            "тест": 2,
            "ui": 2,
            "ux": 2,
        }

        score = 0

        for marker, weight in technical_markers.items():
            if marker in title:
                score += weight

        return score

    def _snapshot_task(self, task: Task) -> dict[str, str | None]:
        return {
            "title": task.title,
            "description": task.description,
            "status": task.status.value,
            "priority": task.priority.value,
            "due_date": task.due_date.isoformat() if task.due_date else None,
        }
