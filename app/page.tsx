'use client'

import { useEffect, useState, useCallback } from 'react'
import { Task, TaskFilters } from '@/lib/types'
import Sidebar from '@/components/Sidebar'
import TaskCard from '@/components/TaskCard'
import TaskForm from '@/components/TaskForm'
import TaskFiltersPanel from '@/components/TaskFilters'
import SummaryPanel from '@/components/SummaryPanel'
import Modal from '@/components/Modal'
import {
  createLocalTask,
  filterLocalTasks,
  patchLocalTask,
  readLocalTasks,
  shouldUseLocalTaskStore,
  writeLocalTasks,
} from '@/lib/localTasks'

type View = 'all' | 'today' | 'upcoming' | 'high'

const VIEW_TITLES: Record<View, string> = {
  all: 'Все задачи',
  today: 'Сегодня',
  upcoming: 'Ближайшие 7 дней',
  high: 'Срочные',
}

async function readApiError(res: Response, fallback: string) {
  try {
    const data = await res.json()
    return data.error ?? fallback
  } catch {
    return fallback
  }
}

function taskMatchesFilters(task: Task, filters: TaskFilters) {
  const search = filters.search.trim().toLowerCase()

  if (filters.status && task.status !== filters.status) return false
  if (filters.priority && task.priority !== filters.priority) return false
  if (!search) return true

  return [task.title, task.description ?? '']
    .some((value) => value.toLowerCase().includes(search))
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('all')
  const [filters, setFilters] = useState<TaskFilters>({ status: '', priority: '', search: '' })
  const [createOpen, setCreateOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [error, setError] = useState('')

  const fetchAll = useCallback(async () => {
    if (shouldUseLocalTaskStore()) {
      setAllTasks(readLocalTasks())
      setError('')
      return
    }

    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error(await readApiError(res, 'Не удалось загрузить задачи'))
      setAllTasks(await res.json())
    } catch (e) {
      const localTasks = readLocalTasks()
      setAllTasks(localTasks)
      setError('')
      console.warn(e instanceof Error ? e.message : 'Не удалось загрузить задачи')
    }
  }, [])

  const fetchFiltered = useCallback(async () => {
    setLoading(true)
    if (shouldUseLocalTaskStore()) {
      const localTasks = readLocalTasks()
      setAllTasks(localTasks)
      setTasks(filterLocalTasks(localTasks, filters))
      setError('')
      setLoading(false)
      return
    }

    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.priority) params.set('priority', filters.priority)
      if (filters.search) params.set('search', filters.search)
      const res = await fetch(`/api/tasks?${params}`)
      if (!res.ok) throw new Error(await readApiError(res, 'Не удалось применить фильтры'))
      setTasks(await res.json())
    } catch (e) {
      const localTasks = readLocalTasks()
      setAllTasks(localTasks)
      setTasks(filterLocalTasks(localTasks, filters))
      setError('')
      console.warn(e instanceof Error ? e.message : 'Не удалось применить фильтры')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchAll()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchAll])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchFiltered()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchFiltered])

  const upsertTaskLocally = useCallback((task: Task) => {
    setAllTasks((current) => {
      const exists = current.some((item) => item.id === task.id)
      return exists
        ? current.map((item) => item.id === task.id ? task : item)
        : [task, ...current]
    })

    setTasks((current) => {
      const exists = current.some((item) => item.id === task.id)
      const matches = taskMatchesFilters(task, filters)

      if (exists && matches) {
        return current.map((item) => item.id === task.id ? task : item)
      }

      if (exists && !matches) {
        return current.filter((item) => item.id !== task.id)
      }

      return matches ? [task, ...current] : current
    })
  }, [filters])

  const removeTaskLocally = useCallback((id: string) => {
    setAllTasks((current) => current.filter((task) => task.id !== id))
    setTasks((current) => current.filter((task) => task.id !== id))
  }, [])

  const visibleTasks = (() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const week = new Date(today)
    week.setDate(week.getDate() + 7)

    switch (view) {
      case 'today':
        return tasks.filter((t) => {
          if (!t.dueDate || t.status === 'done') return false
          const d = new Date(t.dueDate)
          d.setHours(0, 0, 0, 0)
          return d.getTime() === today.getTime()
        })
      case 'upcoming':
        return tasks.filter((t) => {
          if (!t.dueDate || t.status === 'done') return false
          const d = new Date(t.dueDate)
          d.setHours(0, 0, 0, 0)
          return d > today && d <= week
        })
      case 'high':
        return tasks.filter((t) => t.priority === 'high' && t.status !== 'done')
      default:
        return tasks
    }
  })()

  const handleCreate = async (data: Partial<Task>) => {
    if (shouldUseLocalTaskStore()) {
      const task = createLocalTask(data)
      writeLocalTasks([task, ...readLocalTasks()])
      upsertTaskLocally(task)
      setCreateOpen(false)
      setError('')
      return
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        throw new Error(await readApiError(res, 'Не удалось создать задачу'))
      }
      const task = await res.json()
      upsertTaskLocally(task)
    } catch {
      const task = createLocalTask(data)
      writeLocalTasks([task, ...readLocalTasks()])
      upsertTaskLocally(task)
    }
    setCreateOpen(false)
    setError('')
  }

  const handleUpdate = async (id: string, data: Partial<Task>) => {
    const updateLocal = () => {
      const storedTasks = readLocalTasks()
      const sourceTasks = storedTasks.some((task) => task.id === id) ? storedTasks : allTasks
      let updatedTask: Task | null = null
      const nextTasks = sourceTasks.map((task) => {
        if (task.id !== id) return task
        updatedTask = patchLocalTask(task, data)
        return updatedTask
      })

      if (!updatedTask) throw new Error('Задача не найдена')

      writeLocalTasks(nextTasks)
      upsertTaskLocally(updatedTask)
    }

    if (shouldUseLocalTaskStore()) {
      updateLocal()
      setEditTask(null)
      setError('')
      return
    }

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        throw new Error(await readApiError(res, 'Не удалось обновить задачу'))
      }
      const task = await res.json()
      upsertTaskLocally(task)
    } catch {
      updateLocal()
    }
    setEditTask(null)
    setError('')
  }

  const handleDelete = async (id: string) => {
    const deleteLocal = () => {
      const storedTasks = readLocalTasks()
      const sourceTasks = storedTasks.some((task) => task.id === id) ? storedTasks : allTasks
      writeLocalTasks(sourceTasks.filter((task) => task.id !== id))
      removeTaskLocally(id)
    }

    if (shouldUseLocalTaskStore()) {
      deleteLocal()
      setError('')
      return
    }

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        throw new Error(await readApiError(res, 'Не удалось удалить задачу'))
      }
      removeTaskLocally(id)
    } catch {
      deleteLocal()
    }
    setError('')
  }

  const handleApplyCategory = async (id: string, category: string) => {
    await handleUpdate(id, { category })
  }

  const handleCreateSubtasks = async (parentTitle: string, subtasks: string[]) => {
    const createLocalSubtasks = () => {
      const createdTasks = subtasks.map((title) =>
        createLocalTask({ title, description: `К задаче: ${parentTitle}`, priority: 'medium', status: 'pending' })
      )
      writeLocalTasks([...createdTasks, ...readLocalTasks()])
      createdTasks.forEach(upsertTaskLocally)
    }

    if (shouldUseLocalTaskStore()) {
      createLocalSubtasks()
      setError('')
      return
    }

    try {
      const responses = await Promise.all(
        subtasks.map((title) =>
          fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description: `К задаче: ${parentTitle}`, priority: 'medium', status: 'pending' }),
          })
        )
      )
      const failed = responses.find((res) => !res.ok)
      if (failed) {
        throw new Error(await readApiError(failed, 'Не удалось создать подзадачи'))
      }
      const createdTasks = await Promise.all(responses.map((res) => res.json()))
      createdTasks.forEach(upsertTaskLocally)
    } catch {
      createLocalSubtasks()
    }
    setError('')
  }

  const done = allTasks.filter((t) => t.status === 'done').length
  const active = allTasks.filter((t) => t.status !== 'done').length

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <Sidebar view={view} onViewChange={setView} tasks={allTasks} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between gap-3 px-4 py-3 border-b shrink-0 sm:px-6 sm:py-4"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {VIEW_TITLES[view]}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {active} активных · {done} завершено
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex shrink-0 items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium transition-opacity hover:opacity-90 sm:px-4"
            style={{ background: 'var(--accent)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Новая задача
          </button>
        </header>

        {/* Main scroll area */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 sm:px-6 sm:py-5">
          {error && (
            <div
              className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
              style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                className="shrink-0 text-xs font-medium"
              >
                Закрыть
              </button>
            </div>
          )}

          <SummaryPanel tasks={allTasks} />

          <TaskFiltersPanel filters={filters} onChange={setFilters} />

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl animate-pulse"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                />
              ))}
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  style={{ color: 'var(--text-secondary)' }}>
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                Задач нет
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {filters.status || filters.priority || filters.search
                  ? 'Попробуйте изменить фильтры'
                  : 'Нажмите «Новая задача», чтобы начать'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onEdit={setEditTask}
                  onApplyCategory={handleApplyCategory}
                  onCreateSubtasks={handleCreateSubtasks}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {createOpen && (
        <Modal title="Новая задача" onClose={() => setCreateOpen(false)}>
          <TaskForm onSave={handleCreate} onCancel={() => setCreateOpen(false)} />
        </Modal>
      )}

      {editTask && (
        <Modal title="Редактировать задачу" onClose={() => setEditTask(null)}>
          <TaskForm
            task={editTask}
            onSave={(data) => handleUpdate(editTask.id, data)}
            onCancel={() => setEditTask(null)}
          />
        </Modal>
      )}
    </div>
  )
}
