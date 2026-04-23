import { useEffect, useRef, useState } from 'react'
import AppHero from '../../widgets/AppHero/AppHero'
import ChatInput from '../../shared/ui/ChatInput/ChatInput'
import MessageBubble from '../../entities/message/MessageBubble'
import {
  deleteChat,
  getChatHistory,
  sendMessage,
  type ChatMessage,
} from '../../entities/message/message.api'
import styles from './ChatPage.module.scss'

const CHAT_ID_STORAGE_KEY = 'task-tracker-chat-id'

const getPersistentChatId = () => {
  const savedChatId = window.localStorage.getItem(CHAT_ID_STORAGE_KEY)

  if (savedChatId) {
    return savedChatId
  }

  const newChatId = crypto.randomUUID()
  window.localStorage.setItem(CHAT_ID_STORAGE_KEY, newChatId)
  return newChatId
}

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
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [isResettingChat, setIsResettingChat] = useState(false)
  const [chatId, setChatId] = useState(getPersistentChatId)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const mapHistoryToUiMessages = (history: ChatMessage[]): Message[] => {
    const mappedMessages: Message[] = history
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        id: message.id,
        author: message.role === 'assistant' ? 'AI' : 'Пользователь',
        text: message.content,
        variant: message.role === 'assistant' ? 'ai' : 'user',
      }))

    return mappedMessages.length > 0 ? mappedMessages : initialMessages
  }

  const startNewChat = async () => {
    setIsResettingChat(true)

    try {
      await deleteChat(chatId)
    } catch (error) {
      console.error(error)
    }

    const newChatId = crypto.randomUUID()
    window.localStorage.setItem(CHAT_ID_STORAGE_KEY, newChatId)
    setChatId(newChatId)
    setMessages(initialMessages)
    setInputValue('')
    setIsResettingChat(false)
  }

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
        chat_id: chatId,
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
    let isActive = true

    const loadHistory = async () => {
      setIsHistoryLoading(true)

      try {
        const history = await getChatHistory(chatId)

        if (!isActive) return

        setMessages(mapHistoryToUiMessages(history))
      } catch (error) {
        console.error(error)

        if (!isActive) return

        setMessages(initialMessages)
      } finally {
        if (isActive) {
          setIsHistoryLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      isActive = false
    }
  }, [chatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [messages, isTyping])

  return (
    <section className={styles.chatPage}>
      <AppHero />

      <div className={styles.chatToolbar}>
        <button
          type="button"
          className={styles.newChatButton}
          onClick={startNewChat}
          disabled={isResettingChat}
        >
          {isResettingChat ? 'Создаю...' : 'Новый чат'}
        </button>
      </div>

      <div className={styles.messagesArea}>
        <div className={styles.messagesList}>
          {isHistoryLoading && (
            <MessageBubble
              author="AI"
              text="Загружаю историю чата..."
              variant="ai"
            />
          )}

          {!isHistoryLoading && messages.map((message) => (
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
