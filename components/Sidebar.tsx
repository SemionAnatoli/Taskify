'use client'

import { Task } from '@/lib/types'

type View = 'all' | 'today' | 'upcoming' | 'high'

interface Props {
  view: View
  onViewChange: (v: View) => void
  tasks: Task[]
}

const today = new Date()
today.setHours(0, 0, 0, 0)

const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 7)

function count(tasks: Task[], view: View): number {
  switch (view) {
    case 'all':
      return tasks.filter((t) => t.status !== 'done').length
    case 'today':
      return tasks.filter((t) => {
        if (!t.dueDate || t.status === 'done') return false
        const d = new Date(t.dueDate)
        d.setHours(0, 0, 0, 0)
        return d.getTime() === today.getTime()
      }).length
    case 'upcoming':
      return tasks.filter((t) => {
        if (!t.dueDate || t.status === 'done') return false
        const d = new Date(t.dueDate)
        d.setHours(0, 0, 0, 0)
        return d > today && d <= tomorrow
      }).length
    case 'high':
      return tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length
    default:
      return 0
  }
}

const NAV_ITEMS: { id: View; label: string; icon: React.ReactNode }[] = [
  {
    id: 'all',
    label: 'Все задачи',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    id: 'today',
    label: 'Сегодня',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'upcoming',
    label: 'Ближайшие',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: 'high',
    label: 'Срочные',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
]

export default function Sidebar({ view, onViewChange, tasks }: Props) {
  const done = tasks.filter((t) => t.status === 'done').length
  const total = tasks.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <aside
      className="flex flex-col h-full w-60 shrink-0"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
          style={{ background: 'var(--accent)' }}
        >
          T
        </div>
        <span className="text-white font-semibold text-base tracking-tight">Taskify</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto sidebar-scrollbar">
        {NAV_ITEMS.map((item) => {
          const c = count(tasks, item.id)
          const active = view === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors group"
              style={{
                background: active ? 'var(--sidebar-active)' : 'transparent',
                color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)'
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <span className="flex items-center gap-3">
                <span style={{ color: active ? 'var(--accent)' : 'inherit' }}>{item.icon}</span>
                {item.label}
              </span>
              {c > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                  style={{
                    background: active ? 'var(--accent)' : 'var(--sidebar-hover)',
                    color: active ? '#fff' : 'var(--sidebar-text)',
                  }}
                >
                  {c}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Progress block */}
      <div className="mx-4 mb-5 mt-3 p-3 rounded-xl" style={{ background: 'var(--sidebar-hover)' }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium" style={{ color: 'var(--sidebar-text)' }}>
            Прогресс
          </span>
          <span className="text-xs font-bold text-white">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sidebar-bg)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'var(--accent)' }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--sidebar-text)' }}>
          {done} из {total} завершено
        </p>
      </div>
    </aside>
  )
}
