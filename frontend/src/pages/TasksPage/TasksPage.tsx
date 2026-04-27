import { useEffect, useMemo, useState } from "react";
import AppHero from "../../widgets/AppHero/AppHero";
import KanbanBoard from "../../widgets/KanbanBoard/KanbanBoard";
import TaskBoardControls, {
  type SortOption,
} from "../../widgets/TaskBoardControls";
import styles from "./TasksPage.module.scss";
import {
  getTasks,
  updateTask,
  deleteTask,
  type Task,
  type TaskPriority,
  type TaskStatus,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [sortOption, setSortOption] = useState<SortOption>("updated_desc");
  const [isControlsOpen, setIsControlsOpen] = useState(false);

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

  const filteredTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        (task.description?.toLowerCase().includes(normalizedQuery) ?? false) ||
        String(task.id).includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    const sorted = [...filtered].sort((left, right) => {
      if (sortOption === "title_asc") {
        return left.title.localeCompare(right.title, "ru", {
          sensitivity: "base",
        });
      }

      if (sortOption === "due_date_asc" || sortOption === "due_date_desc") {
        const leftTime = left.due_date ? new Date(left.due_date).getTime() : Infinity;
        const rightTime = right.due_date ? new Date(right.due_date).getTime() : Infinity;

        if (sortOption === "due_date_asc") {
          return leftTime - rightTime || left.id - right.id;
        }

        const normalizedLeft = Number.isFinite(leftTime) ? leftTime : -Infinity;
        const normalizedRight = Number.isFinite(rightTime) ? rightTime : -Infinity;
        return normalizedRight - normalizedLeft || left.id - right.id;
      }

      const leftUpdated = left.updated_at ? new Date(left.updated_at).getTime() : 0;
      const rightUpdated = right.updated_at ? new Date(right.updated_at).getTime() : 0;
      return rightUpdated - leftUpdated || right.id - left.id;
    });

    return sorted;
  }, [tasks, searchQuery, statusFilter, priorityFilter, sortOption]);

  const todoTasks = useMemo(
    () => filteredTasks.filter((task) => task.status === "todo"),
    [filteredTasks],
  );

  const inProgressTasks = useMemo(
    () => filteredTasks.filter((task) => task.status === "in_progress"),
    [filteredTasks],
  );

  const doneTasks = useMemo(
    () => filteredTasks.filter((task) => task.status === "done"),
    [filteredTasks],
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

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSortOption("updated_desc");
  };

  return (
    <section className={styles.tasksPage}>
      <AppHero />

      {isLoading && <div className={styles.info}>Загрузка задач...</div>}

      {error && <div className={styles.error}>{error}</div>}

      {!isLoading && !error && (
        <>
          <TaskBoardControls
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            sortOption={sortOption}
            resultsCount={filteredTasks.length}
            isOpen={isControlsOpen}
            onToggle={() => setIsControlsOpen((prev) => !prev)}
            onSearchChange={setSearchQuery}
            onStatusFilterChange={setStatusFilter}
            onPriorityFilterChange={setPriorityFilter}
            onSortChange={setSortOption}
            onReset={handleResetFilters}
          />

          {filteredTasks.length === 0 ? (
            <div className={styles.info}>
              По текущим параметрам задачи не найдены.
            </div>
          ) : (
            <KanbanBoard
              todoTasks={todoTasks}
              inProgressTasks={inProgressTasks}
              doneTasks={doneTasks}
              onTaskClick={handleTaskClick}
            />
          )}
        </>
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
