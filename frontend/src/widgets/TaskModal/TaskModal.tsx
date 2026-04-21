import { useEffect, useState } from "react";
import StatusTabs, {
  type TaskStatus,
} from "../../features/update-task/StatusTabs";
import styles from "./TaskModal.module.scss";
import type {
  Task,
  TaskPriority,
  UpdateTaskPayload,
} from "../../entities/task/task.api";

type TaskModalProps = {
  isOpen: boolean;
  task: Task | null;
  isSaving?: boolean;
  isDeleting?: boolean;
  onClose: () => void;
  onSave: (taskId: number, payload: UpdateTaskPayload) => void;
  onDelete?: (taskId: number) => void;
};

export default function TaskModal({
  isOpen,
  task,
  isSaving,
  isDeleting,
  onClose,
  onSave,
  onDelete,
}: TaskModalProps) {
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [title, setTitle] = useState("Написать отчёт");
  const [description, setDescription] = useState("Написать отчёт");
  const [priority, setPriority] = useState<TaskPriority>("high");
  const [dueDate, setDueDate] = useState("25 января 2026");

  useEffect(() => {
    if (!task) return;

    setStatus(task.status);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setDueDate(task.due_date ?? "");
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSaveClick = () => {
    onSave(task.id, {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      due_date: dueDate || null,
    });
  };

  const handleDeleteClick = () => {
    const isConfirmed = window.confirm("Удалить эту задачу?");

    if (!isConfirmed) return;

    onDelete?.(task.id);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Редактировать задачу</h2>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Закрыть модальное окно"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.statusRow}>
            <StatusTabs value={status} onChange={setStatus} />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="task-title">
              Название задачи:
            </label>

            <input
              id="task-title"
              type="text"
              className={styles.input}
              placeholder="Напишите название задачи"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="task-description">
              Описание:
            </label>

            <textarea
              id="task-description"
              className={styles.textarea}
              placeholder="Напишите описание задачи"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className={styles.bottomRow}>
            <div className={styles.fieldHalf}>
              <label className={styles.label} htmlFor="task-priority">
                Приоритет:
              </label>

              <div className={styles.selectWrapper}>
                <select
                  id="task-priority"
                  className={styles.select}
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as TaskPriority)
                  }
                >
                  <option value="high">Высокий</option>
                  <option value="medium">Средний</option>
                  <option value="low">Низкий</option>
                </select>

                <span className={styles.selectArrow}>⌄</span>
              </div>
            </div>

            <div className={styles.fieldHalf}>
              <label className={styles.label} htmlFor="task-deadline">
                Дедлайн:
              </label>

              <input
                id="task-deadline"
                type="date"
                className={styles.input}
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.deleteButton}
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            {isDeleting ? "Удаление..." : "Удалить"}
          </button>

          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSaveClick}
            disabled={isSaving}
          >
            {isSaving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
