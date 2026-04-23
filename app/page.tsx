'use client'

import { useEffect, useState, useCallback } from 'react'
import { Task, TaskFilters } from '@/lib/types'
import Sidebar from '@/components/Sidebar'
import TaskCard from '@/components/TaskCard'
import TaskForm from '@/components/TaskForm'
import TaskFiltersPanel from '@/components/TaskFilters'
import SummaryPanel from '@/components/SummaryPanel'
import Modal from '@/components/Modal'

type View = 'all' | 'today' | 'upcoming' | 'high'

const VIEW_TITLES: Record<View, string> = {
  all: 'Все задачи',
  today: 'Сегодня',
  upcoming: 'Ближайшие 7 дней',
  high: 'Срочные',
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('all')
  const [filters, setFilters] = useState<TaskFilters>({ status: '', priority: '', search: '' })
  const [createOpen, setCreateOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)

  const fetchAll = useCallback(async () => {
    const res = await fetch('/api/tasks')
    if (res.ok) setAllTasks(await res.json())
  }, [])

  const fetchFiltered = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.search) params.set('search', filters.search)
    const res = await fetch(`/api/tasks?${params}`)
    if (res.ok) setTasks(await res.json())
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    fetchFiltered()
  }, [fetchFiltered])

  const refresh = async () => {
    await Promise.all([fetchAll(), fetchFiltered()])
  }

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
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setCreateOpen(false)
      await refresh()
    }
  }

  const handleUpdate = async (id: string, data: Partial<Task>) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setEditTask(null)
      await refresh()
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    if (res.ok) await refresh()
  }

  const handleCreateSubtasks = async (parentTitle: string, subtasks: string[]) => {
    await Promise.all(
      subtasks.map((title) =>
        fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description: `К задаче: ${parentTitle}`, priority: 'medium', status: 'pending' }),
        })
      )
    )
    await refresh()
  }

  const done = allTasks.filter((t) => t.status === 'done').length
  const active = allTasks.filter((t) => t.status !== 'done').length

  return (
    <div className="flex h-full">
      <Sidebar view={view} onViewChange={setView} tasks={allTasks} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
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
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Новая задача
          </button>
        </header>

        {/* Main scroll area */}
        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
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
