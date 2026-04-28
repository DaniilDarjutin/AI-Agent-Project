import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHero from "../../widgets/AppHero/AppHero";
import styles from "./TaskHistoryPage.module.scss";
import {
  getTask,
  getTaskHistory,
  type Task,
  type TaskHistoryItem,
} from "../../entities/task/task.api";

const fieldLabels: Record<string, string> = {
  title: "Название",
  description: "Описание",
  status: "Статус",
  priority: "Приоритет",
  due_date: "Дедлайн",
};

const statusLabels: Record<string, string> = {
  todo: "К выполнению",
  in_progress: "В процессе",
  done: "Выполнено",
};

const priorityLabels: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

function TaskHistoryPage() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const numericTaskId = Number(taskId);

  const [task, setTask] = useState<Task | null>(null);
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(numericTaskId) || numericTaskId <= 0) {
      setError("Некорректный идентификатор задачи.");
      setIsLoading(false);
      return;
    }

    const loadTaskHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [taskData, historyData] = await Promise.all([
          getTask(numericTaskId),
          getTaskHistory(numericTaskId),
        ]);

        setTask(taskData);
        setHistory(historyData);
      } catch (loadError) {
        console.error(loadError);
        setError("Не удалось загрузить историю задачи.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTaskHistory();
  }, [numericTaskId]);

  const historyCards = useMemo(
    () => history.map((item) => formatHistoryItem(item)),
    [history],
  );

  return (
    <section className={styles.page}>
      <AppHero />

      <div className={styles.topBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate("/tasks")}
        >
          Назад к задачам
        </button>
      </div>

      {isLoading && <div className={styles.info}>Загрузка истории...</div>}

      {error && <div className={styles.error}>{error}</div>}

      {!isLoading && !error && task && (
        <>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>История задачи</div>
            <h1 className={styles.title}>
              [{task.id}] {task.title}
            </h1>
            <div className={styles.metaRow}>
              <span>{formatStatus(task.status)}</span>
              <span>{formatPriority(task.priority)}</span>
              {task.due_date && <span>Дедлайн: {formatDate(task.due_date)}</span>}
            </div>
          </div>

          <div className={styles.timeline}>
            {historyCards.length === 0 ? (
              <div className={styles.info}>Для этой задачи пока нет истории изменений.</div>
            ) : (
              historyCards.map((card) => (
                <article key={card.id} className={styles.historyCard}>
                  <div className={styles.historyHeader}>
                    <h2 className={styles.historyTitle}>{card.title}</h2>
                    <time className={styles.historyTime}>{card.time}</time>
                  </div>

                  <div className={styles.historyBody}>
                    {card.details.map((detail, index) => (
                      <p key={`${card.id}-${index}`} className={styles.historyText}>
                        {detail}
                      </p>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}

function formatHistoryItem(item: TaskHistoryItem) {
  const time = formatDateTime(item.changed_at);

  if (item.action_type === "created") {
    return {
      id: item.id,
      title: "Задача создана",
      time,
      details: item.new_value
        ? [`Создана задача «${item.new_value}».`]
        : ["Задача была добавлена в систему."],
    };
  }

  if (item.action_type === "deleted") {
    return {
      id: item.id,
      title: "Задача удалена",
      time,
      details: item.old_value
        ? [`Удалена задача «${item.old_value}».`]
        : ["Задача была удалена."],
    };
  }

  const fieldLabel = item.field_name ? fieldLabels[item.field_name] ?? item.field_name : "Поле";
  const oldValue = formatFieldValue(item.field_name, item.old_value);
  const newValue = formatFieldValue(item.field_name, item.new_value);

  return {
    id: item.id,
    title: `Изменено поле «${fieldLabel}»`,
    time,
    details: [
      `Было: ${oldValue}`,
      `Стало: ${newValue}`,
    ],
  };
}

function formatFieldValue(fieldName: string | null, value: string | null) {
  if (value === null || value === "") {
    return "Не указано";
  }

  if (fieldName === "status") {
    return formatStatus(value);
  }

  if (fieldName === "priority") {
    return formatPriority(value);
  }

  if (fieldName === "due_date") {
    return formatDate(value);
  }

  return value;
}

function formatStatus(status: string) {
  return `Статус: ${statusLabels[status] ?? status}`;
}

function formatPriority(priority: string) {
  return `Приоритет: ${priorityLabels[priority] ?? priority}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU").format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default TaskHistoryPage;
