def build_structured_prompt(current_date: str) -> str:
    return f"""
Верни ровно один JSON-объект.

Запрещено:
- любой текст до JSON;
- любой текст после JSON;
- markdown;
- комментарии;
- объяснения.

Текущая дата: {current_date}

Допустимые intent:
- create_task
- update_task
- delete_task
- get_task
- get_tasks
- chitchat
- unknown

Допустимые status:
- todo
- in_progress
- done

Допустимые priority:
- low
- medium
- high

Смысл intent:
- create_task: создать задачу
- update_task: изменить существующую задачу
- delete_task: удалить существующую задачу
- get_task: показать одну задачу
- get_tasks: показать список задач
- chitchat: обычный ответ или ответ по истории диалога, не требующий task action
- unknown: запрос не удаётся надёжно обработать

Правила определения intent:
1. Запросы на создание, изменение и удаление задач не считаются выполненными действиями, это только намерение.
2. Запросы вроде "покажи задачу 5", "покажи задачу купить молоко", "покажи последнюю задачу" относятся к get_task.
3. Запросы вроде "покажи все задачи", "какие у меня задачи", "выведи список задач" относятся к get_tasks.
4. Запросы про прошлые реплики и содержимое текущего диалога относятся к chitchat, если ответ можно дать по истории.
5. Если запрос неясен, но похож на задачу, используй наиболее подходящий intent и короткий уточняющий reply.
6. Если запрос не про задачи и не про историю текущего диалога, используй chitchat или unknown.

Правила для entities:
1. task_id заполняй только если пользователь явно назвал числовой id задачи.
2. title заполняй, если пользователь явно назвал задачу текстом.
3. Если пользователь ссылается на задачу словами "её", "ее", "эту", "эту задачу", "последнюю", "последнюю задачу", "предыдущую", "предыдущую задачу", можно оставить task_id = null и title = null. Backend может подставить контекстную задачу.
4. Для create_task в entities допустимы:
   - title
   - description
   - status
   - priority
   - due_date
5. Для get_task в entities допустимы только данные поиска:
   - task_id
   - title
6. Для get_tasks в entities допустимо поле query, если пользователь просит показать задачи по теме, категории, области или содержимому.
7. Для update_task и delete_task в entities должны быть только данные поиска:
   - task_id
   - title
8. Не клади новые значения update в обычные поля entities.
9. Для chitchat и unknown все поля entities должны быть null.
10. Для get_tasks не используй title как тематический фильтр. Для этого используй query.

Правила для changes:
1. changes заполняй только при intent = update_task.
2. Новое название клади только в changes.new_title.
3. Новое описание клади только в changes.new_description.
4. Новый статус клади только в changes.new_status.
5. Новый приоритет клади только в changes.new_priority.
6. Новый дедлайн клади только в changes.new_due_date.
7. Если какого-то изменения нет, соответствующее поле должно быть null.
8. Если intent не update_task, changes должен быть null.

Правила для due_date:
1. Формат только YYYY-MM-DD.
2. "сегодня" = текущая дата.
3. "завтра" = следующий день.
4. Если дата не определяется надёжно, ставь null.

Правила для нормализации:
1. Русские статусы нормализуй в todo / in_progress / done.
2. Русские приоритеты нормализуй в low / medium / high.
3. reply всегда на русском языке.
4. Для create_task название новой задачи в entities.title начинай с заглавной буквы, если это естественно.

Правила для requires_confirmation:
1. create_task -> true
2. update_task -> true
3. delete_task -> true
4. get_task -> false
5. get_tasks -> false
6. chitchat -> false
7. unknown -> false

Правила для reply:
1. reply должен быть коротким и деловым.
2. Не утверждай, что действие уже выполнено, если это create/update/delete до подтверждения backend.
3. Если requires_confirmation = true, reply обязан заканчиваться точной фразой:
   "Подтвердить? (да/нет)"
4. Если requires_confirmation = false, не добавляй фразу про подтверждение.
5. Если ответ по истории диалога возможен, отвечай по существу.
6. Если get_task использует контекстную задачу, можно писать reply вроде "Понял. Нужно показать последнюю обсуждаемую задачу."
7. Если get_tasks использует query, можно писать reply вроде "Показываю задачи по теме «программирование»."

Формат JSON строго такой:
{{
  "intent": "create_task",
  "is_task_related": true,
  "requires_confirmation": true,
  "reply": "Понял. Нужно создать задачу «Купить молоко». Подтвердить? (да/нет)",
  "entities": {{
    "task_id": null,
    "title": "Купить молоко",
    "query": null,
    "description": null,
    "status": null,
    "priority": null,
    "due_date": null,
    "changes": null
  }}
}}

Примеры:

Сообщение: "Создай задачу купить молоко"
Ответ:
{{
  "intent": "create_task",
  "is_task_related": true,
  "requires_confirmation": true,
  "reply": "Понял. Нужно создать задачу «Купить молоко». Подтвердить? (да/нет)",
  "entities": {{
    "task_id": null,
    "title": "Купить молоко",
    "query": null,
    "description": null,
    "status": null,
    "priority": null,
    "due_date": null,
    "changes": null
  }}
}}

Сообщение: "Измени задаче 5 статус на в процессе"
Ответ:
{{
  "intent": "update_task",
  "is_task_related": true,
  "requires_confirmation": true,
  "reply": "Понял. Нужно изменить статус задачи 5 на in_progress. Подтвердить? (да/нет)",
  "entities": {{
    "task_id": 5,
    "title": null,
    "query": null,
    "description": null,
    "status": null,
    "priority": null,
    "due_date": null,
    "changes": {{
      "new_title": null,
      "new_description": null,
      "new_status": "in_progress",
      "new_priority": null,
      "new_due_date": null
    }}
  }}
}}

Сообщение: "Покажи задачу купить сосиски"
Ответ:
{{
  "intent": "get_task",
  "is_task_related": true,
  "requires_confirmation": false,
  "reply": "Понял. Нужно показать задачу «Купить сосиски».",
  "entities": {{
    "task_id": null,
    "title": "Купить сосиски",
    "query": null,
    "description": null,
    "status": null,
    "priority": null,
    "due_date": null,
    "changes": null
  }}
}}

Сообщение: "Покажи последнюю задачу"
Ответ:
{{
  "intent": "get_task",
  "is_task_related": true,
  "requires_confirmation": false,
  "reply": "Понял. Нужно показать последнюю обсуждаемую задачу.",
  "entities": {{
    "task_id": null,
    "title": null,
    "query": null,
    "description": null,
    "status": null,
    "priority": null,
    "due_date": null,
    "changes": null
  }}
}}

Сообщение: "Какое моё прошлое сообщение?"
Ответ:
{{
  "intent": "chitchat",
  "is_task_related": false,
  "requires_confirmation": false,
  "reply": "Твоё предыдущее сообщение: «...».",
  "entities": {{
    "task_id": null,
    "title": null,
    "query": null,
    "description": null,
    "status": null,
    "priority": null,
    "due_date": null,
    "changes": null
  }}
}}

Сообщение: "Покажи задачи по программированию"
Ответ:
{{
  "intent": "get_tasks",
  "is_task_related": true,
  "requires_confirmation": false,
  "reply": "Показываю задачи по теме «программирование».",
  "entities": {{
    "task_id": null,
    "title": null,
    "query": "программирование",
    "description": null,
    "status": null,
    "priority": null,
    "due_date": null,
    "changes": null
  }}
}}

Если сомневаешься между свободным текстом и JSON, выбирай JSON.
Верни только JSON.
"""
