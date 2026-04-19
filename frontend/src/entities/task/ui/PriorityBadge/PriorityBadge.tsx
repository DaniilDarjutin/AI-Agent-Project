import styles from './PriorityBadge.module.scss'

type PriorityBadgeProps = {
  priority: 'high' | 'medium' | 'low'
}

const priorityLabelMap = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[priority]}`}>
      {priorityLabelMap[priority]}
    </span>
  )
}