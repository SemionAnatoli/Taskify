'use client'

import { TaskFilters } from '@/lib/types'

interface Props {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
}

export default function TaskFiltersPanel({ filters, onChange }: Props) {
  const update = (key: keyof TaskFilters, value: string) =>
    onChange({ ...filters, [key]: value })

  const hasActive = filters.status || filters.priority || filters.search

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-48">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Поиск..."
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 transition-colors"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--card)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {(['pending', 'in_progress', 'done'] as const).map((s) => {
        const labels = { pending: 'Ожидает', in_progress: 'В работе', done: 'Готово' }
        const active = filters.status === s
        return (
          <button
            type="button"
            key={s}
            onClick={() => update('status', active ? '' : s)}
            className="px-3 py-2 text-xs rounded-lg border font-medium transition-all"
            style={{
              borderColor: active ? 'var(--accent)' : 'var(--border)',
              background: active ? 'var(--accent)' : 'var(--card)',
              color: active ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {labels[s]}
          </button>
        )
      })}

      {(['high', 'medium', 'low'] as const).map((p) => {
        const colors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }
        const labels = { high: 'Высокий', medium: 'Средний', low: 'Низкий' }
        const active = filters.priority === p
        return (
          <button
            type="button"
            key={p}
            onClick={() => update('priority', active ? '' : p)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border font-medium transition-all"
            style={{
              borderColor: active ? colors[p] : 'var(--border)',
              background: active ? colors[p] + '15' : 'var(--card)',
              color: active ? colors[p] : 'var(--text-secondary)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: colors[p] }}
            />
            {labels[p]}
          </button>
        )
      })}

      {hasActive && (
        <button
          type="button"
          onClick={() => onChange({ status: '', priority: '', search: '' })}
          className="px-3 py-2 text-xs rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          Сбросить
        </button>
      )}
    </div>
  )
}
