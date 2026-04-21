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

export type UpdateTaskPayload = {
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
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

export const updateTask = async (
  taskId: number,
  payload: UpdateTaskPayload,
): Promise<Task> => {
  const response = await api.patch<Task>(`/tasks/${taskId}`, payload)
  return response.data
}

export const deleteTask = async (taskId: number): Promise<void> => {
  await api.delete(`/tasks/${taskId}`)
}