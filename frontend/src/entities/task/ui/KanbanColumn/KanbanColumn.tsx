import TaskCard from '../TaskCard/TaskCard'
import styles from './KanbanColumn.module.scss'

type Task = {
  id: number
  title: string
  priority: 'high' | 'medium' | 'low'
  due_date?: string
}

type KanbanColumnProps = {
  title: string
  tasks: Task[]
  variant: 'todo' | 'inProgress' | 'done'
}

export default function KanbanColumn({
  title,
  tasks,
  variant,
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
            dueDate={task.due_date}
          />
        ))}
      </div>
    </div>
  )
}