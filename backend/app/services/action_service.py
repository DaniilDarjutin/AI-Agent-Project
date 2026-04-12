from typing import Sequence
from sqlmodel import Session
from app.models.task import Task
from app.repositories.task_repository import TaskRepository
from app.schemas.llm_result import TaskEntities
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.task_service import TaskService
from app.utils.enums import TaskPriority, TaskStatus

class ActionService:
    def __init__(self):
        task_repository = TaskRepository()
        self.task_service = TaskService(task_repository)

    def execute(self, session: Session, action: str, entities: TaskEntities):
        if action == "create_task":
            return self._create_task(session, entities)

        if action == "get_tasks":
            return self._get_tasks(session)

        if action == "get_task":
            return self._get_task(session, entities)

        if action == "update_task":
            return self._update_task(session, entities)

        if action == "delete_task":
            return self._delete_task(session, entities)

        return None

    def _create_task(self, session: Session, entities: TaskEntities) -> Task | None:
        if not entities.title:
            return None

        task_data = TaskCreate(
            title=self._normalize_title(entities.title),
            description=entities.description,
            status=entities.status or TaskStatus.TODO,
            priority=entities.priority or TaskPriority.MEDIUM,
            due_date=entities.due_date
        )

        return self.task_service.create_task(session, task_data)

    def _get_tasks(self, session: Session) -> Sequence[Task]:
        return self.task_service.get_all_tasks(session)

    def _get_task(self, session: Session, entities: TaskEntities) -> Task | None:
        if entities.task_id is not None:
            return self.task_service.get_task_by_id(session, entities.task_id)

        if entities.title:
            return self.task_service.resolve_task_by_title(session, entities.title)

        return None

    def _update_task(self, session: Session, entities: TaskEntities) -> Task | None:
        if entities.changes is None:
            return None

        update_payload = {}

        if entities.changes.new_title is not None:
            update_payload["title"] = self._normalize_title(entities.changes.new_title)

        if entities.changes.new_description is not None:
            update_payload["description"] = entities.changes.new_description

        if entities.changes.new_status is not None:
            update_payload["status"] = entities.changes.new_status

        if entities.changes.new_priority is not None:
            update_payload["priority"] = entities.changes.new_priority

        if entities.changes.new_due_date is not None:
            update_payload["due_date"] = entities.changes.new_due_date

        if not update_payload:
            return None

        update_data = TaskUpdate(**update_payload)

        if entities.task_id is not None:
            return self.task_service.update_task(session, entities.task_id, update_data)

        if entities.title:
            existing_task = self.task_service.resolve_task_by_title(session, entities.title)
            return self.task_service.update_task(session, existing_task.id, update_data)

        return None

    def _delete_task(self, session: Session, entities: TaskEntities) -> bool:
        if entities.task_id is not None:
            self.task_service.delete_task(session, entities.task_id)
            return True

        if entities.title:
            existing_task = self.task_service.resolve_task_by_title(session, entities.title)
            self.task_service.delete_task(session, existing_task.id)
            return True

        return False

    def _normalize_title(self, title: str | None) -> str | None:
        if not title:
            return title

        title = title.strip()

        if not title:
            return title

        return title[0].upper() + title[1:]