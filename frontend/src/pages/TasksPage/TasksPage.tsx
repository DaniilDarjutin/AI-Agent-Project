import { useEffect, useMemo, useState } from 'react'
import AppHero from '../../widgets/AppHero/AppHero'
import KanbanBoard from '../../widgets/KanbanBoard/KanbanBoard'
import styles from './TasksPage.module.scss'
import { getTasks, Task } from '../../entities/task/task.api'

function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const data = await getTasks()
        setTasks(data)
      } catch (error) {
        console.error(error)
        setError('Не удалось загрузить задачи.')
      } finally {
        setIsLoading(false)
      }
    }

    loadTasks()
  }, [])

  const todoTasks = useMemo(
    () => tasks.filter((task) => task.status === 'todo'),
    [tasks],
  )

  const inProgressTasks = useMemo(
    () => tasks.filter((task) => task.status === 'in_progress'),
    [tasks],
  )

  const doneTasks = useMemo(
    () => tasks.filter((task) => task.status === 'done'),
    [tasks],
  )
  
  return (
    <section className={styles.tasksPage}>
      <AppHero/>

      {isLoading && <div className={styles.info}>Загрузка задач...</div>}

      {error && <div className={styles.error}>{error}</div>}

      {!isLoading && !error && (
        <KanbanBoard
          todoTasks={todoTasks}
          inProgressTasks={inProgressTasks}
          doneTasks={doneTasks}
        />
      )}
    </section>
  )
}

export default TasksPage