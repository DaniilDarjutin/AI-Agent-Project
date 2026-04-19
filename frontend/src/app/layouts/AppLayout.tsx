import { Outlet, useLocation } from 'react-router-dom'
import styles from './AppLayout.module.scss'

function AppLayout() {
  const location = useLocation()

  const isChatPage = location.pathname === '/chat'
  const isTasksPage = location.pathname === '/tasks'

  return (
    <div className={styles.page}>
      <div className={`
          ${styles.shell}
          ${isChatPage ? styles.chatLayout : ''}
          ${isTasksPage ? styles.tasksLayout : ''}
        `}>
        <div className={styles.glowGreen} />
        <div className={styles.glowBlue} />

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AppLayout