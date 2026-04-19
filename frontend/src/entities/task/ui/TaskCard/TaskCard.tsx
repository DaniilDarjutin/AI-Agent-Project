import PriorityBadge from '../PriorityBadge/PriorityBadge'
import styles from './TaskCard.module.scss'

type TaskCardProps = {
  title: string
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
}

export default function TaskCard({
  title,
  priority,
  dueDate,
}: TaskCardProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>

      <div className={styles.footer}>
        <PriorityBadge priority={priority} />
        {dueDate && <span className={styles.date}>{dueDate}</span>}
      </div>
    </div>
  )
}