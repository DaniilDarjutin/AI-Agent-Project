from datetime import datetime, timezone

from sqlmodel import Session, select

from app.models.chat_state import ChatState


class ChatStateRepository:
    def get_by_chat_id(self, session: Session, chat_id: str) -> ChatState | None:
        statement = select(ChatState).where(ChatState.chat_id == chat_id)
        return session.exec(statement).first()

    def create(
        self,
        session: Session,
        chat_id: str,
        pending_action: str | None,
        pending_entities_json: str | None,
        awaiting_confirmation: bool
    ) -> ChatState:
        chat_state = ChatState(
            chat_id=chat_id,
            pending_action=pending_action,
            pending_entities_json=pending_entities_json,
            awaiting_confirmation=awaiting_confirmation
        )

        session.add(chat_state)
        session.commit()
        session.refresh(chat_state)
        return chat_state

    def update(
        self,
        session: Session,
        chat_state: ChatState,
        pending_action: str | None,
        pending_entities_json: str | None,
        awaiting_confirmation: bool
    ) -> ChatState:
        chat_state.pending_action = pending_action
        chat_state.pending_entities_json = pending_entities_json
        chat_state.awaiting_confirmation = awaiting_confirmation
        chat_state.updated_at = datetime.now(timezone.utc)

        session.add(chat_state)
        session.commit()
        session.refresh(chat_state)
        return chat_state

    def delete(self, session: Session, chat_state: ChatState) -> None:
        session.delete(chat_state)
        session.commit()