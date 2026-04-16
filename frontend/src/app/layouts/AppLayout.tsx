import { Outlet } from 'react-router-dom'
import styles from './AppLayout.module.scss'

function AppLayout() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
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