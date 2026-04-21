import PriorityBadge from "../PriorityBadge/PriorityBadge";
import styles from "./TaskCard.module.scss";

type TaskCardProps = {
  title: string;
  priority: "high" | "medium" | "low";
  dueDate?: string;
  onClick?: () => void;
};

export default function TaskCard({
  title,
  priority,
  dueDate,
  onClick,
}: TaskCardProps) {
  return (
    <div className={styles.card} onClick={onClick}>
      <h3 className={styles.title}>{title}</h3>

      <div className={styles.footer}>
        <PriorityBadge priority={priority} />
        {dueDate && <span className={styles.date}>{dueDate}</span>}
      </div>
    </div>
  );
}
