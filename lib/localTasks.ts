import { Priority, Status, Task, TaskFilters } from './types'

const STORAGE_KEY = 'taskify.tasks.v1'

const PRIORITIES: Priority[] = ['low', 'medium', 'high']
const STATUSES: Status[] = ['pending', 'in_progress', 'done']

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function dateWithOffset(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(12, 0, 0, 0)
  return date.toISOString()
}

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function buildDemoTasks(): Task[] {
  const now = new Date().toISOString()

  return [
    {
      id: 'demo-taskify-presentation',
      title: 'Подготовить демонстрацию Taskify',
      description: 'Проверить создание задач, статусы, фильтры и AI-план дня перед показом работодателю.',
      category: 'Работа',
      priority: 'high',
      status: 'in_progress',
      dueDate: dateWithOffset(0),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-ai-plan',
      title: 'Составить план дня через AI',
      description: 'Показать, как ассистент выбирает порядок задач и объясняет следующий шаг.',
      category: 'AI',
      priority: 'high',
      status: 'pending',
      dueDate: dateWithOffset(1),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-polish',
      title: 'Отполировать интерфейс карточек',
      description: 'Проверить клики по задаче, смену статусов и адаптивность на небольшом экране.',
      category: 'UI',
      priority: 'medium',
      status: 'pending',
      dueDate: dateWithOffset(3),
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function normalizePriority(value: unknown): Priority {
  return PRIORITIES.includes(value as Priority) ? value as Priority : 'medium'
}

function normalizeStatus(value: unknown): Status {
  return STATUSES.includes(value as Status) ? value as Status : 'pending'
}

export function shouldUseLocalTaskStore() {
  if (!isBrowser()) return false

  return !['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
}

export function readLocalTasks() {
  if (!isBrowser()) return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as Task[]
    }
  } catch {
    return buildDemoTasks()
  }

  const demoTasks = buildDemoTasks()
  writeLocalTasks(demoTasks)
  return demoTasks
}

export function writeLocalTasks(tasks: Task[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function filterLocalTasks(tasks: Task[], filters: TaskFilters) {
  const search = filters.search.trim().toLowerCase()

  return tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false
    if (filters.priority && task.priority !== filters.priority) return false
    if (!search) return true

    return [task.title, task.description ?? '']
      .some((value) => value.toLowerCase().includes(search))
  })
}

export function createLocalTask(data: Partial<Task>): Task {
  const now = new Date().toISOString()
  const title = typeof data.title === 'string' && data.title.trim()
    ? data.title.trim()
    : 'Новая задача'

  return {
    id: makeId(),
    title,
    description: typeof data.description === 'string' ? data.description.trim() || null : null,
    category: typeof data.category === 'string' ? data.category.trim() || null : null,
    priority: normalizePriority(data.priority),
    status: normalizeStatus(data.status),
    dueDate: typeof data.dueDate === 'string' && data.dueDate ? new Date(data.dueDate).toISOString() : null,
    createdAt: now,
    updatedAt: now,
  }
}

export function patchLocalTask(task: Task, data: Partial<Task>): Task {
  return {
    ...task,
    ...(data.title !== undefined && { title: data.title?.trim() || task.title }),
    ...(data.description !== undefined && { description: data.description?.trim() || null }),
    ...(data.category !== undefined && { category: data.category?.trim() || null }),
    ...(data.priority !== undefined && { priority: normalizePriority(data.priority) }),
    ...(data.status !== undefined && { status: normalizeStatus(data.status) }),
    ...(data.dueDate !== undefined && {
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    }),
    updatedAt: new Date().toISOString(),
  }
}
