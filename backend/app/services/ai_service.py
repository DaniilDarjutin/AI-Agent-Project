import json
from datetime import date

from gigachat import GigaChat, session_id_cvar
from gigachat.models import Chat, Messages
from sqlmodel import Session

from app.core.config import settings
from app.prompts.structured_prompt import build_structured_prompt
from app.prompts.system_prompt import SYSTEM_PROMPT
from app.repositories.chat_message_repository import ChatMessageRepository
from app.repositories.chat_state_repository import ChatStateRepository
from app.schemas.chat import ChatResponse
from app.schemas.llm_result import LLMResult, TaskEntities
from app.services.action_service import ActionService
from app.services.chat_history_service import ChatHistoryService
from app.services.chat_state_service import ChatStateService
from app.utils.exceptions import AmbiguousTaskMatchError


class AIService:
    MAX_HISTORY_MESSAGES = 12

    def __init__(self):
        self.action_service = ActionService()
        self.chat_state_service = ChatStateService(ChatStateRepository())
        self.chat_history_service = ChatHistoryService(ChatMessageRepository())

    def clear_chat(self, session: Session, chat_id: str) -> None:
        self.chat_history_service.clear_history(session, chat_id)

        chat_state = self.chat_state_service.chat_state_repository.get_by_chat_id(
            session,
            chat_id,
        )
        if chat_state is not None:
            self.chat_state_service.chat_state_repository.delete(session, chat_state)

    def process_message(
        self,
        session: Session,
        chat_id: str,
        message: str
    ) -> ChatResponse:
        self.chat_history_service.add_user_message(
            session=session,
            chat_id=chat_id,
            content=message
        )

        pending_state = self.chat_state_service.get_pending_action(session, chat_id)

        if pending_state["status"] == "expired":
            return self._respond(
                session=session,
                chat_id=chat_id,
                response=ChatResponse(
                    reply="Подтверждение устарело. Повторите действие заново.",
                    action="unknown",
                    requires_confirmation=False,
                    entities=None
                )
            )

        if pending_state["status"] == "active":
            if self._is_confirmation(message):
                response = self._execute_confirmed_action(
                    session=session,
                    chat_id=chat_id,
                    action=pending_state["action"],
                    entities=pending_state["entities"]
                )
                self.chat_state_service.clear_pending_action(session, chat_id)
                return self._respond(session=session, chat_id=chat_id, response=response)

            if self._is_rejection(message):
                self.chat_state_service.clear_pending_action(session, chat_id)
                return self._respond(
                    session=session,
                    chat_id=chat_id,
                    response=ChatResponse(
                        reply="Хорошо, действие отменено.",
                        action=None,
                        requires_confirmation=False,
                        entities=None
                    )
                )

            return self._respond(
                session=session,
                chat_id=chat_id,
                response=ChatResponse(
                    reply="Ожидаю подтверждение действия. Ответьте 'да' для подтверждения или 'нет' для отмены.",
                    action=pending_state["action"],
                    requires_confirmation=True,
                    entities=pending_state["entities"]
                )
            )

        current_date = date.today().isoformat()
        structured_prompt = build_structured_prompt(current_date)
        combined_system_prompt = f"{SYSTEM_PROMPT}\n\n{structured_prompt}"

        history_messages = self.chat_history_service.get_messages_for_llm(
            session=session,
            chat_id=chat_id
        )
        history_messages = history_messages[-self.MAX_HISTORY_MESSAGES:]

        llm_messages = [
            Messages(role="system", content=combined_system_prompt),
            *history_messages,
        ]

        with GigaChat(
            credentials=settings.gigachat_auth_key,
            scope=settings.gigachat_scope,
            model=settings.gigachat_model,
            verify_ssl_certs=settings.gigachat_verify_ssl,
        ) as giga:
            token = session_id_cvar.set(chat_id)
            try:
                response = giga.chat(Chat(messages=llm_messages))
            finally:
                session_id_cvar.reset(token)

        raw_content = response.choices[0].message.content
        print("RAW LLM RESPONSE:", raw_content)

        try:
            parsed_data = self._parse_llm_json(raw_content)
            llm_result = LLMResult.model_validate(parsed_data)
        except (json.JSONDecodeError, ValueError) as e:
            print("LLM PARSE ERROR:", repr(e))
            return self._respond(
                session=session,
                chat_id=chat_id,
                response=ChatResponse(
                    reply="Не удалось корректно обработать ответ модели.",
                    action="unknown",
                    requires_confirmation=False,
                    entities=None
                )
            )

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

        llm_result.entities = self._apply_task_context(
            session=session,
            chat_id=chat_id,
            message=message,
            intent=llm_result.intent,
            entities=llm_result.entities
        )

        if llm_result.requires_confirmation:
            self.chat_state_service.save_pending_action(
                session=session,
                chat_id=chat_id,
                action=llm_result.intent,
                entities=llm_result.entities
            )

            return self._respond(
                session=session,
                chat_id=chat_id,
                response=ChatResponse(
                    reply=self._normalize_reply(llm_result.reply),
                    action=llm_result.intent,
                    requires_confirmation=True,
                    entities=llm_result.entities
                )
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

            return self._respond(
                session=session,
                chat_id=chat_id,
                response=ChatResponse(
                    reply=self._normalize_reply(
                        f"Найдено несколько похожих задач. Уточните id или полное название:\n{tasks_text}"
                    ),
                    action="unknown",
                    requires_confirmation=False,
                    entities=None
                )
            )

        final_response = self._build_action_response(
            session=session,
            chat_id=chat_id,
            llm_result=llm_result,
            action_result=action_result,
        )
        return self._respond(session=session, chat_id=chat_id, response=final_response)

    def _respond(self, session: Session, chat_id: str, response: ChatResponse) -> ChatResponse:
        self.chat_history_service.add_assistant_message(
            session=session,
            chat_id=chat_id,
            content=response.reply,
        )
        return response

    def _build_action_response(
        self,
        session: Session,
        chat_id: str,
        llm_result: LLMResult,
        action_result,
    ) -> ChatResponse:
        if llm_result.intent == "get_tasks":
            if not action_result:
                return ChatResponse(
                    reply="Список задач пуст.",
                    action=llm_result.intent,
                    requires_confirmation=False,
                    entities=llm_result.entities
                )

            tasks_text = "\n\n".join(
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

            self._remember_task_context(
                session=session,
                chat_id=chat_id,
                task_id=action_result.id,
                task_title=action_result.title,
            )

            return ChatResponse(
                reply=self._normalize_reply(self._format_task_full(action_result)),
                action=llm_result.intent,
                requires_confirmation=False,
                entities=llm_result.entities
            )

        if llm_result.intent == "create_task":
            if action_result is not None:
                self._remember_task_context(
                    session=session,
                    chat_id=chat_id,
                    task_id=action_result.id,
                    task_title=action_result.title,
                )

            return ChatResponse(
                reply=self._normalize_reply(llm_result.reply),
                action=llm_result.intent,
                requires_confirmation=False,
                entities=llm_result.entities
            )

        if llm_result.intent == "update_task":
            if action_result is not None:
                self._remember_task_context(
                    session=session,
                    chat_id=chat_id,
                    task_id=action_result.id,
                    task_title=action_result.title,
                )

            return ChatResponse(
                reply=self._normalize_reply(llm_result.reply),
                action=llm_result.intent,
                requires_confirmation=False,
                entities=llm_result.entities
            )

        if llm_result.intent == "delete_task":
            if action_result is not None:
                self._clear_task_context_if_matches(
                    session=session,
                    chat_id=chat_id,
                    task_id=action_result.id,
                )

            return ChatResponse(
                reply=self._normalize_reply(llm_result.reply),
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

    def _apply_task_context(
        self,
        session: Session,
        chat_id: str,
        message: str,
        intent: str,
        entities: TaskEntities | None,
    ) -> TaskEntities:
        resolved_entities = entities or TaskEntities()

        if intent not in {"get_task", "update_task", "delete_task"}:
            return resolved_entities

        if resolved_entities.task_id is not None or resolved_entities.title:
            return resolved_entities

        if not self._references_context_task(message):
            return resolved_entities

        task_context = self.chat_state_service.get_task_context(session, chat_id)

        if task_context["last_task_id"] is not None:
            resolved_entities.task_id = int(task_context["last_task_id"])
            return resolved_entities

        if task_context["last_task_title"]:
            resolved_entities.title = str(task_context["last_task_title"])

        return resolved_entities

    def _references_context_task(self, message: str) -> bool:
        normalized = f" {message.strip().lower()} "
        references = (
            " её ",
            " ее ",
            " эту ",
            " этой ",
            " этот ",
            " последнюю ",
            " последней ",
            " последнюю задачу ",
            " эту задачу ",
        )
        return any(reference in normalized for reference in references)

    def _remember_task_context(
        self,
        session: Session,
        chat_id: str,
        task_id: int | None,
        task_title: str | None,
    ) -> None:
        self.chat_state_service.save_task_context(
            session=session,
            chat_id=chat_id,
            task_id=task_id,
            task_title=task_title,
        )

    def _clear_task_context_if_matches(
        self,
        session: Session,
        chat_id: str,
        task_id: int,
    ) -> None:
        task_context = self.chat_state_service.get_task_context(session, chat_id)

        if task_context["last_task_id"] != task_id:
            return

        self.chat_state_service.save_task_context(
            session=session,
            chat_id=chat_id,
            task_id=None,
            task_title=None,
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

    def _execute_confirmed_action(
        self,
        session: Session,
        chat_id: str,
        action: str,
        entities: TaskEntities | None
    ) -> ChatResponse:
        resolved_entities = self._apply_task_context(
            session=session,
            chat_id=chat_id,
            message="её",
            intent=action,
            entities=entities
        )

        try:
            action_result = self.action_service.execute(
                session=session,
                action=action,
                entities=resolved_entities
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
                    entities=resolved_entities
                )

            self._remember_task_context(
                session=session,
                chat_id=chat_id,
                task_id=action_result.id,
                task_title=action_result.title,
            )

            return ChatResponse(
                reply=self._normalize_reply(f"Задача «{action_result.title}» создана."),
                action=action,
                requires_confirmation=False,
                entities=resolved_entities
            )

        if action == "update_task":
            if action_result is None:
                return ChatResponse(
                    reply="Не удалось обновить задачу.",
                    action=action,
                    requires_confirmation=False,
                    entities=resolved_entities
                )

            self._remember_task_context(
                session=session,
                chat_id=chat_id,
                task_id=action_result.id,
                task_title=action_result.title,
            )

            update_summary = self._build_update_summary(action_result.title, resolved_entities)

            return ChatResponse(
                reply=self._normalize_reply(update_summary),
                action=action,
                requires_confirmation=False,
                entities=resolved_entities
            )

        if action == "delete_task":
            if action_result is None:
                return ChatResponse(
                    reply="Не удалось удалить задачу.",
                    action=action,
                    requires_confirmation=False,
                    entities=resolved_entities
                )

            self._clear_task_context_if_matches(
                session=session,
                chat_id=chat_id,
                task_id=action_result.id,
            )

            return ChatResponse(
                reply=self._normalize_reply(f"Задача «{action_result.title}» удалена."),
                action=action,
                requires_confirmation=False,
                entities=resolved_entities
            )

        return ChatResponse(
            reply="Действие выполнено.",
            action=action,
            requires_confirmation=False,
            entities=resolved_entities
        )

    def _build_update_summary(self, task_title: str, entities: TaskEntities | None) -> str:
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
        status_map = {
            "todo": "К выполнению",
            "in_progress": "В процессе",
            "done": "Выполнено",
        }

        priority_map = {
            "low": "Низкий",
            "medium": "Средний",
            "high": "Высокий",
        }

        lines = [
            f"[{task.id}] {task.title}",
            f"Статус: {status_map.get(task.status.value, task.status.value)}",
            f"Приоритет: {priority_map.get(task.priority.value, task.priority.value)}",
        ]

        if task.due_date is not None:
            lines.append(f"Дедлайн: {task.due_date.strftime('%d.%m.%Y')}")

        return "\n".join(lines)

    def _format_task_full(self, task) -> str:
        status_map = {
            "todo": "К выполнению",
            "in_progress": "В процессе",
            "done": "Выполнено",
        }

        priority_map = {
            "low": "Низкий",
            "medium": "Средний",
            "high": "Высокий",
        }

        lines = [
            f"[{task.id}] {task.title}",
            f"Статус: {status_map.get(task.status.value, task.status.value)}",
            f"Приоритет: {priority_map.get(task.priority.value, task.priority.value)}",
        ]

        if task.description:
            lines.append(f"Описание: {task.description}")

        if task.due_date is not None:
            lines.append(f"Дедлайн: {task.due_date.strftime('%d.%m.%Y')}")

        return "\n".join(lines)

    def _normalize_reply(self, reply: str) -> str:
        reply = reply.strip()

        if not reply:
            return reply

        return reply[0].upper() + reply[1:]

    def _parse_llm_json(self, raw_content: str) -> dict:
        try:
            return json.loads(raw_content)
        except json.JSONDecodeError:
            start = raw_content.find("{")
            end = raw_content.rfind("}")

            if start == -1 or end == -1 or end <= start:
                raise

            candidate = raw_content[start:end + 1]
            return json.loads(candidate)
