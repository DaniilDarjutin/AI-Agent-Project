import axios from 'axios'

export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export type Task = {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_at?: string
  updated_at?: string
}

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const getTasks = async (): Promise<Task[]> => {
  const response = await api.get<Task[]>('/tasks/')
  return response.data
}