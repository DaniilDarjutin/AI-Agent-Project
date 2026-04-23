from typing import Sequence

from fastapi import APIRouter, Depends, Response, status
from sqlmodel import Session
from app.core.database import get_session
from app.schemas.chat import ChatMessageRead, ChatRequest, ChatResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/chat", tags=["Chat"])

ai_service = AIService()

@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest, session: Session = Depends(get_session)):
    return ai_service.process_message(
        session=session,
        chat_id=request.chat_id,
        message=request.message
    )


@router.get("/{chat_id}/history", response_model=Sequence[ChatMessageRead])
def get_chat_history(chat_id: str, session: Session = Depends(get_session)):
    return ai_service.chat_history_service.get_history(session, chat_id)


@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat(chat_id: str, session: Session = Depends(get_session)):
    ai_service.clear_chat(session, chat_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
