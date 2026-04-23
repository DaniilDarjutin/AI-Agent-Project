from sqlmodel import Session
from gigachat.models import Messages

from app.models.chat_message import ChatMessage
from app.repositories.chat_message_repository import ChatMessageRepository


class ChatHistoryService:
    def __init__(self, chat_message_repository: ChatMessageRepository):
        self.chat_message_repository = chat_message_repository

    def get_messages_for_llm(self, session: Session, chat_id: str) -> list[Messages]:
        history = self.chat_message_repository.get_by_chat_id(session, chat_id)

        return [
            Messages(
                role=message.role,
                content=message.content,
            )
            for message in history
        ]

    def get_history(self, session: Session, chat_id: str) -> list[ChatMessage]:
        return list(self.chat_message_repository.get_by_chat_id(session, chat_id))

    def add_user_message(self, session: Session, chat_id: str, content: str) -> None:
        self.chat_message_repository.create(
            session=session,
            chat_id=chat_id,
            role="user",
            content=content,
        )

    def add_assistant_message(self, session: Session, chat_id: str, content: str) -> None:
        self.chat_message_repository.create(
            session=session,
            chat_id=chat_id,
            role="assistant",
            content=content,
        )

    def clear_history(self, session: Session, chat_id: str) -> None:
        self.chat_message_repository.delete_by_chat_id(session, chat_id)
