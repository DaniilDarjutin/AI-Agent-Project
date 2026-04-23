import axios from 'axios'

export type ChatRequest = {
  chat_id: string
  message: string
}

export type ChatResponse = {
  reply: string
}

export type ChatMessage = {
  id: number
  chat_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const sendMessage = async (
  payload: ChatRequest,
): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/chat/', payload)
  return response.data
}

export const getChatHistory = async (chatId: string): Promise<ChatMessage[]> => {
  const response = await api.get<ChatMessage[]>(`/chat/${chatId}/history`)
  return response.data
}

export const deleteChat = async (chatId: string): Promise<void> => {
  await api.delete(`/chat/${chatId}`)
}
