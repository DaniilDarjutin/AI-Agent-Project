import styles from './ChatInput.module.scss'

type ChatInputProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
}

export default function ChatInput({
  value,
  onChange,
  onSend,
}: ChatInputProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSend()
    }
  }

  return (
    <div className={styles.wrapper}>
      <input
        type="text"
        className={styles.input}
        placeholder="Type your message..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button type="button" className={styles.sendButton} onClick={onSend}>
        <img src="/send.svg" alt="Send" className={styles.sendIcon} />
      </button>
    </div>
  )
}