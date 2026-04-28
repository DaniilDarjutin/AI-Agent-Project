import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import ChatPage from '../../pages/ChatPage/ChatPage'
import TasksPage from '../../pages/TasksPage/TasksPage'
import TaskHistoryPage from '../../pages/TaskHistoryPage/TaskHistoryPage'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:taskId/history" element={<TaskHistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
