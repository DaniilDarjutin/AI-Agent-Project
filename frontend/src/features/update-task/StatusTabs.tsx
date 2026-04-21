import styles from "./StatusTabs.module.scss";

export type TaskStatus = "todo" | "in_progress" | "done";

type StatusOption = {
  key: TaskStatus;
  label: string;
};

const statuses: StatusOption[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

type StatusTabsProps = {
  value: TaskStatus;
  onChange: (value: TaskStatus) => void;
};

export default function StatusTabs({ value, onChange }: StatusTabsProps) {
  return (
    <div className={styles.statusBar}>
      {statuses.map((status) => {
        const isActive = value === status.key;

        return (
          <button
            key={status.key}
            type="button"
            className={`
              ${styles.statusSegment}
              ${styles[status.key]}
              ${isActive ? styles.active : styles.dimmed}
            `}
            onClick={() => onChange(status.key)}
          >
            {status.label}
          </button>
        );
      })}
    </div>
  );
}
