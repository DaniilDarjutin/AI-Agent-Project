import type { TaskPriority, TaskStatus } from "../../entities/task/task.api";
import styles from "./TaskBoardControls.module.scss";

export type SortOption =
  | "updated_desc"
  | "due_date_asc"
  | "due_date_desc"
  | "title_asc";

type TaskBoardControlsProps = {
  searchQuery: string;
  statusFilter: "all" | TaskStatus;
  priorityFilter: "all" | TaskPriority;
  sortOption: SortOption;
  resultsCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | TaskStatus) => void;
  onPriorityFilterChange: (value: "all" | TaskPriority) => void;
  onSortChange: (value: SortOption) => void;
  onReset: () => void;
};

function TaskBoardControls({
  searchQuery,
  statusFilter,
  priorityFilter,
  sortOption,
  resultsCount,
  isOpen,
  onToggle,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onSortChange,
  onReset,
}: TaskBoardControlsProps) {
  return (
    <div className={styles.controlsPanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelInfo}>
          <h2 className={styles.panelTitle}>Поиск и фильтры</h2>
          <div className={styles.resultsInfo}>
            Найдено задач: <strong>{resultsCount}</strong>
          </div>
        </div>

        <button
          type="button"
          className={styles.toggleButton}
          onClick={onToggle}
        >
          {isOpen ? "Скрыть" : "Показать"}
        </button>
      </div>

      {isOpen && (
        <>
          <div className={styles.searchGroup}>
            <label className={styles.controlLabel} htmlFor="task-search">
              Поиск
            </label>
            <input
              id="task-search"
              type="text"
              className={styles.searchInput}
              placeholder="Название, описание или id задачи"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>

          <div className={styles.filtersRow}>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel} htmlFor="status-filter">
                Статус
              </label>
              <select
                id="status-filter"
                className={styles.select}
                value={statusFilter}
                onChange={(event) =>
                  onStatusFilterChange(event.target.value as "all" | TaskStatus)
                }
              >
                <option value="all">Все</option>
                <option value="todo">К выполнению</option>
                <option value="in_progress">В процессе</option>
                <option value="done">Выполнено</option>
              </select>
            </div>

            <div className={styles.controlGroup}>
              <label className={styles.controlLabel} htmlFor="priority-filter">
                Приоритет
              </label>
              <select
                id="priority-filter"
                className={styles.select}
                value={priorityFilter}
                onChange={(event) =>
                  onPriorityFilterChange(event.target.value as "all" | TaskPriority)
                }
              >
                <option value="all">Все</option>
                <option value="high">Высокий</option>
                <option value="medium">Средний</option>
                <option value="low">Низкий</option>
              </select>
            </div>

            <div className={styles.controlGroup}>
              <label className={styles.controlLabel} htmlFor="sort-tasks">
                Сортировка
              </label>
              <select
                id="sort-tasks"
                className={styles.select}
                value={sortOption}
                onChange={(event) => onSortChange(event.target.value as SortOption)}
              >
                <option value="updated_desc">Сначала новые</option>
                <option value="due_date_asc">Дедлайн ближе</option>
                <option value="due_date_desc">Дедлайн дальше</option>
                <option value="title_asc">По названию</option>
              </select>
            </div>
          </div>

          <div className={styles.panelFooter}>
            <button
              type="button"
              className={styles.resetButton}
              onClick={onReset}
            >
              Сбросить
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TaskBoardControls;
