from typing import Sequence

from sqlmodel import Session, select

from app.models.chat_message import ChatMessage


class ChatMessageRepository:
    def get_by_chat_id(self, session: Session, chat_id: str) -> Sequence[ChatMessage]:
        statement = (
            select(ChatMessage)
            .where(ChatMessage.chat_id == chat_id)
            .order_by(ChatMessage.created_at, ChatMessage.id)
        )
        return session.exec(statement).all()

    def create(
        self,
        session: Session,
        chat_id: str,
        role: str,
        content: str,
    ) -> ChatMessage:
        message = ChatMessage(
            chat_id=chat_id,
            role=role,
            content=content,
        )
        session.add(message)
        session.commit()
        session.refresh(message)
        return message

    def delete_by_chat_id(self, session: Session, chat_id: str) -> None:
        messages = self.get_by_chat_id(session, chat_id)
        for message in messages:
            session.delete(message)
        session.commit()
