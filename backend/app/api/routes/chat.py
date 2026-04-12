from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.core.database import get_session
from app.schemas.chat import ChatRequest, ChatResponse
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