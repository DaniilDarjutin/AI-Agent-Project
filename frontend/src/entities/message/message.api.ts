import axios from 'axios'

export type ChatRequest = {
  chat_id: string
  message: string
}

export type ChatResponse = {
  reply: string
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