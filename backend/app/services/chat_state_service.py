import json
from datetime import datetime, timedelta, timezone
from sqlmodel import Session
from app.repositories.chat_state_repository import ChatStateRepository
from app.schemas.llm_result import TaskEntities

class ChatStateService:
    TTL_MINUTES = 10

    def __init__(self, chat_state_repository: ChatStateRepository):
        self.chat_state_repository = chat_state_repository

    def get_pending_action(self, session: Session, chat_id: str):
        chat_state = self.chat_state_repository.get_by_chat_id(session, chat_id)

        if chat_state is None or not chat_state.awaiting_confirmation:
            return {"status": "missing"}

        if self._is_expired(chat_state.updated_at):
            self.chat_state_repository.clear_pending(session, chat_state)
            return {"status": "expired"}

        entities = None
        if chat_state.pending_entities_json:
            entities_data = json.loads(chat_state.pending_entities_json)
            entities = TaskEntities.model_validate(entities_data)

        return {
            "status": "active",
            "action": chat_state.pending_action,
            "entities": entities
        }

    def save_pending_action(
        self,
        session: Session,
        chat_id: str,
        action: str,
        entities: TaskEntities
    ):
        entities_json = json.dumps(entities.model_dump(mode="json"))

        chat_state = self.chat_state_repository.get_by_chat_id(session, chat_id)

        if chat_state is None:
            return self.chat_state_repository.create(
                session=session,
                chat_id=chat_id,
                pending_action=action,
                pending_entities_json=entities_json,
                awaiting_confirmation=True
            )

        return self.chat_state_repository.update(
            session=session,
            chat_state=chat_state,
            pending_action=action,
            pending_entities_json=entities_json,
            awaiting_confirmation=True
        )

    def clear_pending_action(self, session: Session, chat_id: str) -> None:
        chat_state = self.chat_state_repository.get_by_chat_id(session, chat_id)

        if chat_state is None:
            return

        self.chat_state_repository.clear_pending(session, chat_state)

    def get_task_context(self, session: Session, chat_id: str) -> dict[str, int | str | None]:
        chat_state = self.chat_state_repository.get_by_chat_id(session, chat_id)

        if chat_state is None:
            return {
                "last_task_id": None,
                "last_task_title": None,
            }

        return {
            "last_task_id": chat_state.last_task_id,
            "last_task_title": chat_state.last_task_title,
        }

    def save_task_context(
        self,
        session: Session,
        chat_id: str,
        task_id: int | None,
        task_title: str | None,
    ):
        chat_state = self.chat_state_repository.get_by_chat_id(session, chat_id)

        if chat_state is None:
            return self.chat_state_repository.create(
                session=session,
                chat_id=chat_id,
                pending_action=None,
                pending_entities_json=None,
                awaiting_confirmation=False,
                last_task_id=task_id,
                last_task_title=task_title,
            )

        return self.chat_state_repository.update(
            session=session,
            chat_state=chat_state,
            pending_action=chat_state.pending_action,
            pending_entities_json=chat_state.pending_entities_json,
            awaiting_confirmation=chat_state.awaiting_confirmation,
            last_task_id=task_id,
            last_task_title=task_title,
        )

    def _is_expired(self, updated_at: datetime) -> bool:
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)
        return now - updated_at > timedelta(minutes=self.TTL_MINUTES)
