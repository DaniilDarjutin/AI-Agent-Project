import { useEffect, useMemo, useState } from "react";
import AppHero from "../../widgets/AppHero/AppHero";
import KanbanBoard from "../../widgets/KanbanBoard/KanbanBoard";
import styles from "./TasksPage.module.scss";
import {
  getTasks,
  updateTask,
  deleteTask,
  type Task,
  type UpdateTaskPayload,
} from "../../entities/task/task.api";
import TaskModal from "../../widgets/TaskModal/TaskModal";

function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getTasks();
        setTasks(data);
      } catch (error) {
        console.error(error);
        setError("Не удалось загрузить задачи.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  const todoTasks = useMemo(
    () => tasks.filter((task) => task.status === "todo"),
    [tasks],
  );

  const inProgressTasks = useMemo(
    () => tasks.filter((task) => task.status === "in_progress"),
    [tasks],
  );

  const doneTasks = useMemo(
    () => tasks.filter((task) => task.status === "done"),
    [tasks],
  );

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleSaveTask = async (taskId: number, payload: UpdateTaskPayload) => {
    try {
      setIsSaving(true);

      const updatedTask = await updateTask(taskId, payload);

      setTasks((prev) =>
        prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      );

      setSelectedTask(updatedTask);
      setIsModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error(error);
      alert("Не удалось сохранить изменения.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      setIsDeleting(true);

      await deleteTask(taskId);

      setTasks((prev) => prev.filter((task) => task.id !== taskId));

      setIsModalOpen(false);

      setSelectedTask(null);
    } catch (error) {
      console.error(error);

      alert("Не удалось удалить задачу.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className={styles.tasksPage}>
      <AppHero />

      {isLoading && <div className={styles.info}>Загрузка задач...</div>}

      {error && <div className={styles.error}>{error}</div>}

      {!isLoading && !error && (
        <KanbanBoard
          todoTasks={todoTasks}
          inProgressTasks={inProgressTasks}
          doneTasks={doneTasks}
          onTaskClick={handleTaskClick}
        />
      )}

      <TaskModal
        isOpen={isModalOpen}
        task={selectedTask}
        isSaving={isSaving}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </section>
  );
}

export default TasksPage;
