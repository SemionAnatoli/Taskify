export type Priority = 'low' | 'medium' | 'high'
export type Status = 'pending' | 'in_progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string | null
  priority: Priority
  status: Status
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskFilters {
  status: string
  priority: string
  search: string
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}

export const STATUS_LABELS: Record<Status, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  done: 'Готово',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

export const STATUS_COLORS: Record<Status, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-emerald-100 text-emerald-800',
}
