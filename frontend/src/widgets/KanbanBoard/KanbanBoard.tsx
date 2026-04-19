import KanbanColumn from '../../entities/task/ui/KanbanColumn/KanbanColumn'
import styles from './KanbanBoard.module.scss'

type Task = {
  id: number
  title: string
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
}

type KanbanBoardProps = {
  todoTasks: Task[]
  inProgressTasks: Task[]
  doneTasks: Task[]
}

export default function KanbanBoard({
  todoTasks,
  inProgressTasks,
  doneTasks,
}: KanbanBoardProps) {
  return (
    <div className={styles.board}>
      <KanbanColumn title="To Do" tasks={todoTasks} variant="todo" />
      <KanbanColumn
        title="In Progress"
        tasks={inProgressTasks}
        variant="inProgress"
      />
      <KanbanColumn title="Done" tasks={doneTasks} variant="done" />
    </div>
  )
}