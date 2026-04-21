import KanbanColumn from "../../entities/task/ui/KanbanColumn/KanbanColumn";
import styles from "./KanbanBoard.module.scss";
import type { Task } from "../../entities/task/task.api";


type KanbanBoardProps = {
  todoTasks: Task[];
  inProgressTasks: Task[];
  doneTasks: Task[];
  onTaskClick: (task: Task) => void;
};

export default function KanbanBoard({
  todoTasks,
  inProgressTasks,
  doneTasks,
  onTaskClick,
}: KanbanBoardProps) {
  return (
    <div className={styles.board}>
      <KanbanColumn
        title="To Do"
        tasks={todoTasks}
        variant="todo"
        onTaskClick={onTaskClick}
      />
      <KanbanColumn
        title="In Progress"
        tasks={inProgressTasks}
        variant="inProgress"
        onTaskClick={onTaskClick}
      />
      <KanbanColumn
        title="Done"
        tasks={doneTasks}
        variant="done"
        onTaskClick={onTaskClick}
      />
    </div>
  );
}
