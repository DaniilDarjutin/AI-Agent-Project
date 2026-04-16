import { useEffect, useRef, useState } from 'react'
import AppHero from '../../widgets/AppHero/AppHero'
import ChatInput from '../../shared/ui/ChatInput/ChatInput'
import MessageBubble from '../../entities/message/MessageBubble'
import { sendMessage } from '../../entities/message/message.api'
import styles from './ChatPage.module.scss'

type Message = {
  id: number
  author: string
  text: string
  variant: 'ai' | 'user'
}

const initialMessages: Message[] = [
  {
    id: 1,
    author: 'AI',
    text: 'Привет! Я помогу тебе управлять задачами.',
    variant: 'ai',
  },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const chatIdRef = useRef<string>(crypto.randomUUID())

  const handleSend = async () => {
    const trimmedValue = inputValue.trim()

    if (!trimmedValue || isTyping) return

    const userMessage: Message = {
      id: Date.now(),
      author: 'Пользователь',
      text: trimmedValue,
      variant: 'user',
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const data = await sendMessage({
        chat_id: chatIdRef.current,
        message: trimmedValue,
      })

      const aiMessage: Message = {
        id: Date.now() + 1,
        author: 'AI',
        text: data.reply,
        variant: 'ai',
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error: unknown) {
        let errorText = 'Ошибка при получении ответа от сервера.'

        if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error
        ) {
          const axiosError = error as {
            response?: {
              data?: {
                detail?: string
              }
            }
          }

          errorText = axiosError.response?.data?.detail || errorText
        }

        const errorMessage: Message = {
          id: Date.now() + 1,
          author: 'AI',
          text: errorText,
          variant: 'ai',
        }

        setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [messages, isTyping])

  return (
    <section className={styles.chatPage}>
      <AppHero />

      <div className={styles.messagesArea}>
        <div className={styles.messagesList}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              author={message.author}
              text={message.text}
              variant={message.variant}
            />
          ))}

          {isTyping && (
            <MessageBubble
              author="AI"
              text="AI is typing..."
              variant="ai"
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className={styles.inputArea}>
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
        />
      </div>
    </section>
  )
}