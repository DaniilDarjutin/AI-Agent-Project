from fastapi import APIRouter
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/chat", tags=["Chat"])

ai_service = AIService()

@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest):
    return ai_service.process_message(request.message)