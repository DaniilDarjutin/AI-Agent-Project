import json
from gigachat import GigaChat
from gigachat.models import Chat, Messages
from app.core.config import settings
from app.prompts.structured_prompt import STRUCTURED_PROMPT
from app.prompts.system_prompt import SYSTEM_PROMPT
from app.schemas.chat import ChatResponse
from app.schemas.llm_result import LLMResult

class AIService:
    def process_message(self, message: str) -> ChatResponse:
        combined_system_prompt = f"{SYSTEM_PROMPT}\n\n{STRUCTURED_PROMPT}"

        with GigaChat(
            credentials=settings.gigachat_auth_key,
            scope=settings.gigachat_scope,
            model=settings.gigachat_model,
            verify_ssl_certs=settings.gigachat_verify_ssl,
        ) as giga:
            response = giga.chat(
                Chat(
                    messages=[
                        Messages(
                            role="system",
                            content=combined_system_prompt
                        ),
                        Messages(
                            role="user",
                            content=message
                        )
                    ]
                )
            )

        raw_content = response.choices[0].message.content
        print("LLM response:", raw_content)

        try:
            parsed_data = json.loads(raw_content)
            llm_result = LLMResult.model_validate(parsed_data)

            return ChatResponse(
                reply=llm_result.reply,
                action=llm_result.intent,
                requires_confirmation=llm_result.requires_confirmation,
                entities=llm_result.entities
            )
        except (json.JSONDecodeError, ValueError):
            return ChatResponse(
                reply="Не удалось корректно обработать ответ модели.",
                action="unknown",
                requires_confirmation=False,
                entities=None
            )