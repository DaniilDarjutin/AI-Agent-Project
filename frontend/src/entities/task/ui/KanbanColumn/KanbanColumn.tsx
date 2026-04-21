import TaskCard from "../TaskCard/TaskCard";
import styles from "./KanbanColumn.module.scss";
import type { Task } from "../../task.api";

type KanbanColumnProps = {
  title: string;
  tasks: Task[];
  variant: "todo" | "inProgress" | "done";
  onTaskClick: (task: Task) => void;
};

export default function KanbanColumn({
  title,
  tasks,
  variant,
  onTaskClick,
}: KanbanColumnProps) {
  return (
    <div className={`${styles.column} ${styles[variant]}`}>
      <div className={styles.header}>{title}</div>

      <div className={styles.list}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            title={task.title}
            priority={task.priority}
            dueDate={task.due_date ?? undefined}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>
    </div>
  );
}
