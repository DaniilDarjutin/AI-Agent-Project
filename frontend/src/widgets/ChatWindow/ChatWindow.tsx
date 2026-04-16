import styles from "./ChatWindow.module.scss"

function ChatWindow() {
  return (
    <section className={styles.wrapper}>
      <h1 className={styles.title}>Chat</h1>
      <div className={styles.box}>Здесь будет чат с AI</div>
    </section>
  )
}

export default ChatWindow
