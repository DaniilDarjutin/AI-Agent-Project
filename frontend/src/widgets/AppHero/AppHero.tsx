import styles from './AppHero.module.scss'

function AppHero() {
  return (
    <div className={styles.hero}>
      <img
        src="/stars.svg"
        alt="Stars"
        className={styles.icon}
      />

      <h1 className={styles.title}>Your Task Tracker Assistant</h1>
    </div>
  )
}

export default AppHero