from typing import Sequence

from sqlmodel import Session, select

from app.models.task_history import TaskHistory


class TaskHistoryRepository:
    def get_by_task_id(self, session: Session, task_id: int) -> Sequence[TaskHistory]:
        statement = (
            select(TaskHistory)
            .where(TaskHistory.task_id == task_id)
            .order_by(TaskHistory.changed_at, TaskHistory.id)
        )
        return session.exec(statement).all()

    def create(
        self,
        session: Session,
        task_id: int,
        action_type: str,
        field_name: str | None = None,
        old_value: str | None = None,
        new_value: str | None = None,
    ) -> TaskHistory:
        history_item = TaskHistory(
            task_id=task_id,
            action_type=action_type,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
        )
        session.add(history_item)
        session.commit()
        session.refresh(history_item)
        return history_item
