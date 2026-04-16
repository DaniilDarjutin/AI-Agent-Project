import styles from './MessageBubble.module.scss'

interface MessageBubbleProps {
  author: string
  text: string
  variant: 'user' | 'ai'
}

export default function MessageBubble({ author, text, variant }: MessageBubbleProps) {
  const isUser = variant === 'user'

  return (
    <div className={`${styles.messageRow} ${isUser ? styles.userRow : styles.aiRow}`}>
      <div className={styles.messageMeta}>{author}</div>

      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.aiBubble}`}>
        {text}
      </div>
    </div>
  )
}