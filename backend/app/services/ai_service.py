import json
from datetime import date
from gigachat import GigaChat
from gigachat.models import Chat, Messages
from sqlmodel import Session
from app.core.config import settings
from app.prompts.structured_prompt import build_structured_prompt
from app.prompts.system_prompt import SYSTEM_PROMPT
from app.repositories.chat_state_repository import ChatStateRepository
from app.schemas.chat import ChatResponse
from app.schemas.llm_result import LLMResult
from app.services.action_service import ActionService
from app.services.chat_state_service import ChatStateService
from app.utils.exceptions import AmbiguousTaskMatchError

class AIService:
    def __init__(self):
        self.action_service = ActionService()
        self.chat_state_service = ChatStateService(ChatStateRepository())

    def process_message(
        self,
        session: Session,
        chat_id: str,
        message: str
    ) -> ChatResponse:
        pending_state = self.chat_state_service.get_pending_action(session, chat_id)

        if pending_state["status"] == "expired":
            return ChatResponse(
                reply="Подтверждение устарело. Повторите действие заново.",
                action="unknown",
                requires_confirmation=False,
                entities=None
            )

        if pending_state["status"] == "active":
            if self._is_confirmation(message):
                response = self._execute_confirmed_action(
                    session=session,
                    action=pending_state["action"],
                    entities=pending_state["entities"]
                )
                self.chat_state_service.clear_pending_action(session, chat_id)
                return response

            if self._is_rejection(message):
                self.chat_state_service.clear_pending_action(session, chat_id)
                return ChatResponse(
                    reply="Хорошо, действие отменено.",
                    action=None,
                    requires_confirmation=False,
                    entities=None
                )

            return ChatResponse(
                reply="Ожидаю подтверждение действия. Ответьте 'да' для подтверждения или 'нет' для отмены.",
                action=pending_state["action"],
                requires_confirmation=True,
                entities=pending_state["entities"]
            )

        current_date = date.today().isoformat()
        structured_prompt = build_structured_prompt(current_date)
        combined_system_prompt = f"{SYSTEM_PROMPT}\n\n{structured_prompt}"

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
        print("RAW LLM RESPONSE:", raw_content)

        try:
            parsed_data = json.loads(raw_content)
            llm_result = LLMResult.model_validate(parsed_data)

            allowed_actions = {
                "create_task",
                "update_task",
                "delete_task",
                "get_task",
                "get_tasks",
                "chitchat",
                "unknown",
            }

            if llm_result.intent not in allowed_actions:
                llm_result.intent = "unknown"
                llm_result.requires_confirmation = False
                llm_result.reply = "Я не могу надёжно обработать этот запрос в рамках текущих функций."

            if llm_result.requires_confirmation:
                self.chat_state_service.save_pending_action(
                    session=session,
                    chat_id=chat_id,
                    action=llm_result.intent,
                    entities=llm_result.entities
                )

                return ChatResponse(
                    reply=self._normalize_reply(llm_result.reply),
                    action=llm_result.intent,
                    requires_confirmation=True,
                    entities=llm_result.entities
                )

            try:
                action_result = self.action_service.execute(
                    session=session,
                    action=llm_result.intent,
                    entities=llm_result.entities
                )
            except AmbiguousTaskMatchError as e:
                tasks_text = "\n".join(
                    f"{task.id}. {task.title}"
                    for task in e.tasks[:5]
                )

                return ChatResponse(
                    reply=self._normalize_reply(
                        f"Найдено несколько похожих задач. Уточните id или полное название:\n{tasks_text}"
                    ),
                    action="unknown",
                    requires_confirmation=False,
                    entities=None
                )

            if llm_result.intent == "get_tasks":
                if not action_result:
                    return ChatResponse(
                        reply="Список задач пуст.",
                        action=llm_result.intent,
                        requires_confirmation=False,
                        entities=llm_result.entities
                    )

                tasks_text = "\n".join(
                    self._format_task_short(task)
                    for task in action_result
                )

                return ChatResponse(
                    reply=self._normalize_reply(f"Вот актуальный список задач:\n{tasks_text}"),
                    action=llm_result.intent,
                    requires_confirmation=False,
                    entities=llm_result.entities
                )

            if llm_result.intent == "get_task":
                if action_result is None:
                    return ChatResponse(
                        reply="Задача не найдена.",
                        action=llm_result.intent,
                        requires_confirmation=False,
                        entities=llm_result.entities
                    )

                return ChatResponse(
                    reply=self._normalize_reply(self._format_task_full(action_result)),
                    action=llm_result.intent,
                    requires_confirmation=False,
                    entities=llm_result.entities
                )

            return ChatResponse(
                reply=self._normalize_reply(llm_result.reply),
                action=llm_result.intent,
                requires_confirmation=False,
                entities=llm_result.entities
            )

        except (json.JSONDecodeError, ValueError) as e:
            print("LLM PARSE ERROR:", repr(e))
            return ChatResponse(
                reply="Не удалось корректно обработать ответ модели.",
                action="unknown",
                requires_confirmation=False,
                entities=None
            )

    def _is_confirmation(self, message: str) -> bool:
        normalized = message.strip().lower()
        confirmations = {
            "да",
            "ок",
            "okay",
            "ok",
            "подтверждаю",
            "подтвердить",
            "сделай",
            "верно",
            "ага",
            "yes"
        }
        return normalized in confirmations

    def _is_rejection(self, message: str) -> bool:
        normalized = message.strip().lower()
        rejections = {
            "нет",
            "не надо",
            "отмена",
            "отменить",
            "cancel",
            "no"
        }
        return normalized in rejections

    def _execute_confirmed_action(self, session: Session, action: str, entities) -> ChatResponse:
        try:
            action_result = self.action_service.execute(
                session=session,
                action=action,
                entities=entities
            )
        except AmbiguousTaskMatchError as e:
            tasks_text = "\n".join(
                f"{task.id}. {task.title}"
                for task in e.tasks[:5]
            )

            return ChatResponse(
                reply=self._normalize_reply(
                    f"Найдено несколько похожих задач. Уточните id или полное название:\n{tasks_text}"
                ),
                action="unknown",
                requires_confirmation=False,
                entities=None
            )

        if action == "create_task":
            if action_result is None:
                return ChatResponse(
                    reply="Не удалось создать задачу.",
                    action=action,
                    requires_confirmation=False,
                    entities=entities
                )

            return ChatResponse(
                reply=self._normalize_reply(f"Задача «{action_result.title}» создана."),
                action=action,
                requires_confirmation=False,
                entities=entities
            )

        if action == "update_task":
            if action_result is None:
                return ChatResponse(
                    reply="Не удалось обновить задачу.",
                    action=action,
                    requires_confirmation=False,
                    entities=entities
                )

            update_summary = self._build_update_summary(action_result.title, entities)

            return ChatResponse(
                reply=self._normalize_reply(update_summary),
                action=action,
                requires_confirmation=False,
                entities=entities
            )

        if action == "delete_task":
            deleted_title = entities.title or "задача"

            if not action_result:
                return ChatResponse(
                    reply="Не удалось удалить задачу.",
                    action=action,
                    requires_confirmation=False,
                    entities=entities
                )

            return ChatResponse(
                reply=self._normalize_reply(f"Задача «{deleted_title}» удалена."),
                action=action,
                requires_confirmation=False,
                entities=entities
            )

        return ChatResponse(
            reply="Действие выполнено.",
            action=action,
            requires_confirmation=False,
            entities=entities
        )

    def _build_update_summary(self, task_title: str, entities) -> str:
        changes = entities.changes if entities else None

        if changes is None:
            return f"Задача «{task_title}» обновлена."

        parts = []

        if changes.new_title is not None:
            parts.append(f"название на «{changes.new_title}»")

        if changes.new_description is not None:
            parts.append("описание")

        if changes.new_status is not None:
            parts.append(f"статус на {changes.new_status.value}")

        if changes.new_priority is not None:
            parts.append(f"приоритет на {changes.new_priority.value}")

        if changes.new_due_date is not None:
            parts.append(f"дедлайн на {changes.new_due_date.isoformat()}")

        if not parts:
            return f"Задача «{task_title}» обновлена."

        if len(parts) == 1:
            return f"У задачи «{task_title}» изменён {parts[0]}."

        joined = ", ".join(parts[:-1]) + f" и {parts[-1]}"
        return f"У задачи «{task_title}» изменены {joined}."

    def _format_task_short(self, task) -> str:
        parts = [f"{task.id}. {task.title}", f"статус: {task.status.value}", f"приоритет: {task.priority.value}"]

        if task.due_date is not None:
            parts.append(f"дедлайн: {task.due_date.isoformat()}")

        return " | ".join(parts)

    def _format_task_full(self, task) -> str:
        lines = [
            f"Задача {task.id}: {task.title}",
            f"Статус: {task.status.value}",
            f"Приоритет: {task.priority.value}",
        ]

        if task.description:
            lines.append(f"Описание: {task.description}")

        if task.due_date is not None:
            lines.append(f"Дедлайн: {task.due_date.isoformat()}")

        return "\n".join(lines)

    def _normalize_reply(self, reply: str) -> str:
        reply = reply.strip()

        if not reply:
            return reply

        return reply[0].upper() + reply[1:]