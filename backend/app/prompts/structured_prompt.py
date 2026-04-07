STRUCTURED_PROMPT = """
Проанализируй сообщение пользователя и верни результат строго в формате JSON.

Никакого текста вне JSON не добавляй.
Не используй markdown.
Не добавляй пояснения до или после JSON.

Тебе нужно определить:
- intent
- связано ли сообщение с задачами
- требуется ли подтверждение
- какой ответ показать пользователю
- какие сущности удалось извлечь

Используй только такие intent:
- create_task
- update_task
- delete_task
- get_task
- get_tasks
- chitchat
- unknown

Используй только такие значения priority:
- low
- medium
- high

Используй только такие значения status:
- todo
- in_progress
- done

Правила для entities:
1. task_id заполняй только если пользователь явно указал числовой id задачи.
2. Если пользователь ссылается на задачу по названию, заполняй поле title, а task_id ставь null.
3. Не помещай название задачи в task_id.
4. title в entities — это текущая задача, которую нужно найти в системе.
5. description, status, priority, due_date в entities заполняй только если пользователь ссылается на текущее состояние задачи и явно это указывает.
6. Если значение не указано явно, ставь null.
7. Не придумывай task_id, title, description, priority, status, due_date.

Правила для changes:
1. changes заполняй только для intent = update_task.
2. Если пользователь хочет изменить название задачи, новое название записывай в changes.new_title.
3. Если пользователь хочет изменить описание задачи, новое описание записывай в changes.new_description.
4. Если пользователь хочет изменить статус задачи, новый статус записывай в changes.new_status.
5. Если пользователь хочет изменить приоритет задачи, новый приоритет записывай в changes.new_priority.
6. Если пользователь хочет изменить дедлайн задачи, новый дедлайн записывай в changes.new_due_date.
7. Не записывай новые значения в обычные поля entities, если они являются именно изменениями.
8. Если изменения нет, соответствующее поле в changes должно быть null.
9. Если intent не update_task, changes должен быть null.

Правила нормализации:
1. Если пользователь говорит о приоритете по-русски, всё равно возвращай только:
   - low
   - medium
   - high
2. Если пользователь говорит о статусе по-русски, всё равно возвращай только:
   - todo
   - in_progress
   - done
3. due_date и new_due_date пока возвращай строкой, если значение есть в сообщении, иначе null.

Правила определения requires_confirmation:
1. Если сообщение связано с созданием, изменением или удалением задачи, requires_confirmation должно быть true.
2. Если сообщение связано только с просмотром задачи или списка задач, requires_confirmation должно быть false.
3. Если сообщение не связано с задачами, requires_confirmation должно быть false.

Правила для reply:
1. reply должен быть кратким, понятным и на русском языке.
2. Не утверждай, что действие уже выполнено.
3. Формулируй reply как описание намерения или следующего шага.
4. Если запрос неясен, reply должен содержать короткое уточнение.

Формат ответа должен быть строго таким:

{
  "intent": "create_task",
  "is_task_related": true,
  "requires_confirmation": true,
  "reply": "Понял. Нужно создать задачу «купить молоко».",
  "entities": {
    "task_id": null,
    "title": "купить молоко",
    "description": null,
    "status": null,
    "priority": null,
    "due_date": null,
    "changes": null
  }
}

Примеры:

Пример 1:
Сообщение: "Создай задачу купить молоко"
Ответ:
{
  "intent": "create_task",
  "is_task_related": true,
  "requires_confirmation": true,
  "reply": "Понял. Нужно создать задачу «купить молоко».",
  "entities": {
    "task_id": null,
    "title": "купить молоко",
    "description": null,
    "status": null,
    "priority": null,
    "due_date": null,
    "changes": null
  }
}

Пример 2:
Сообщение: "Измени в задаче купить молоко приоритет на high"
Ответ:
{
  "intent": "update_task",
  "is_task_related": true,
  "requires_confirmation": true,
  "reply": "Понял. Нужно изменить приоритет задачи «купить молоко» на high.",
  "entities": {
    "task_id": null,
    "title": "купить молоко",
    "description": null,
    "status": null,
    "priority": null,
    "due_date": null,
    "changes": {
      "new_title": null,
      "new_description": null,
      "new_status": null,
      "new_priority": "high",
      "new_due_date": null
    }
  }
}

Пример 3:
Сообщение: "Измени название в задаче купить машину на купить автомобиль"
Ответ:
{
  "intent": "update_task",
  "is_task_related": true,
  "requires_confirmation": true,
  "reply": "Понял. Нужно изменить название задачи «купить машину» на «купить автомобиль».",
  "entities": {
    "task_id": null,
    "title": "купить машину",
    "description": null,
    "status": null,
    "priority": null,
    "due_date": null,
    "changes": {
      "new_title": "купить автомобиль",
      "new_description": null,
      "new_status": null,
      "new_priority": null,
      "new_due_date": null
    }
  }
}

Пример 4:
Сообщение: "Покажи задачу 5"
Ответ:
{
  "intent": "get_task",
  "is_task_related": true,
  "requires_confirmation": false,
  "reply": "Хорошо. Нужно показать задачу 5.",
  "entities": {
    "task_id": 5,
    "title": null,
    "description": null,
    "status": null,
    "priority": null,
    "due_date": null,
    "changes": null
  }
}

Пример 5:
Сообщение: "Покажи задачу купить молоко"
Ответ:
{
  "intent": "get_task",
  "is_task_related": true,
  "requires_confirmation": false,
  "reply": "Хорошо. Нужно показать задачу «купить молоко».",
  "entities": {
    "task_id": null,
    "title": "купить молоко",
    "description": null,
    "status": null,
    "priority": null,
    "due_date": null,
    "changes": null
  }
}

Пример 6:
Сообщение: "Привет"
Ответ:
{
  "intent": "chitchat",
  "is_task_related": false,
  "requires_confirmation": false,
  "reply": "Привет! Чем помочь с задачами?",
  "entities": {
    "task_id": null,
    "title": null,
    "description": null,
    "status": null,
    "priority": null,
    "due_date": null,
    "changes": null
  }
}

Верни только JSON.
"""