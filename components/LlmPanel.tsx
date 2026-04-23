'use client'

import { useState } from 'react'
import { Task, Priority, PRIORITY_LABELS } from '@/lib/types'

interface Props {
  task: Task
  onApplyPriority: (priority: Priority) => void
  onApplySubtasks: (subtasks: string[]) => void
  onClose: () => void
}

type LlmAction = 'categorize' | 'priority' | 'decompose'

interface CategoryResult { category: string; reason: string }
interface PriorityResult { priority: Priority; reason: string }

const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
}

export default function LlmPanel({ task, onApplyPriority, onApplySubtasks, onClose }: Props) {
  const [loading, setLoading] = useState<LlmAction | null>(null)
  const [categoryResult, setCategoryResult] = useState<CategoryResult | null>(null)
  const [priorityResult, setPriorityResult] = useState<PriorityResult | null>(null)
  const [subtasks, setSubtasks] = useState<string[] | null>(null)

  const callLLM = async (action: LlmAction) => {
    setLoading(action)
    try {
      const res = await fetch(`/api/llm/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return data
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка запроса')
      return null
    } finally {
      setLoading(null)
    }
  }

  const Spinner = () => (
    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )

  const ActionBtn = ({
    action,
    icon,
    label,
    onClick,
  }: {
    action: LlmAction
    icon: string
    label: string
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      disabled={!!loading}
      className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg border font-medium transition-all disabled:opacity-50"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--surface)',
        color: 'var(--text-secondary)',
      }}
    >
      {loading === action ? <Spinner /> : <span>{icon}</span>}
      {label}
    </button>
  )

  return (
    <div
      className="mt-3 pt-3 border-t animate-fade-in"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--accent)' }}
        >
          Ассистент
        </span>
        <button
          onClick={onClose}
          className="text-xs transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          скрыть
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionBtn
          action="categorize"
          icon="🏷"
          label="Категория"
          onClick={async () => {
            const data = await callLLM('categorize')
            if (data) setCategoryResult(data)
          }}
        />
        <ActionBtn
          action="priority"
          icon="⚡"
          label="Приоритет"
          onClick={async () => {
            const data = await callLLM('priority')
            if (data) setPriorityResult(data)
          }}
        />
        <ActionBtn
          action="decompose"
          icon="⚙"
          label="Разбить на шаги"
          onClick={async () => {
            const data = await callLLM('decompose')
            if (data) setSubtasks(data.subtasks)
          }}
        />
      </div>

      {categoryResult && (
        <div
          className="mt-2.5 p-3 rounded-lg text-xs animate-fade-in"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Категория: {categoryResult.category}
          </p>
          <p className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {categoryResult.reason}
          </p>
          <button
            onClick={() => setCategoryResult(null)}
            className="mt-1.5 text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            Закрыть
          </button>
        </div>
      )}

      {priorityResult && (
        <div
          className="mt-2.5 p-3 rounded-lg text-xs animate-fade-in"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="font-semibold" style={{ color: PRIORITY_COLORS[priorityResult.priority] }}>
            Рекомендован: {PRIORITY_LABELS[priorityResult.priority]}
          </p>
          <p className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {priorityResult.reason}
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { onApplyPriority(priorityResult.priority); setPriorityResult(null) }}
              className="px-2.5 py-1 rounded-md text-white text-xs font-medium"
              style={{ background: PRIORITY_COLORS[priorityResult.priority] }}
            >
              Применить
            </button>
            <button
              onClick={() => setPriorityResult(null)}
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {subtasks && (
        <div
          className="mt-2.5 p-3 rounded-lg text-xs animate-fade-in"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Подзадачи:
          </p>
          <ul className="space-y-1">
            {subtasks.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent)', marginTop: 1 }}>›</span>
                {s}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-2.5">
            <button
              onClick={() => { onApplySubtasks(subtasks); setSubtasks(null) }}
              className="px-2.5 py-1 rounded-md text-white text-xs font-medium"
              style={{ background: 'var(--accent)' }}
            >
              Создать задачи
            </button>
            <button
              onClick={() => setSubtasks(null)}
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
