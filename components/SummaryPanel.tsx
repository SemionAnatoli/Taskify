'use client'

import { useState } from 'react'
import { Priority, PRIORITY_LABELS, Status, STATUS_LABELS, Task } from '@/lib/types'

interface Props {
  tasks: Task[]
}

interface DailyPlanItem {
  taskId: string
  title: string
  reason: string
  nextAction: string
  priority: Priority
  status: Status
}

interface DailyPlan {
  intro: string
  items: DailyPlanItem[]
  later: string[]
}

type LoadingAction = 'summary' | 'plan' | null
type VisibleResult = 'summary' | 'plan' | null

const PRIORITY_COLOR: Record<Priority, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
}

const STATUS_COLOR: Record<Status, string> = {
  pending: '#6b7280',
  in_progress: '#0284c7',
  done: '#059669',
}

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function SummaryPanel({ tasks }: Props) {
  const [summary, setSummary] = useState('')
  const [plan, setPlan] = useState<DailyPlan | null>(null)
  const [loading, setLoading] = useState<LoadingAction>(null)
  const [visible, setVisible] = useState<VisibleResult>(null)
  const [error, setError] = useState('')

  const fetchSummary = async () => {
    setLoading('summary')
    setSummary('')
    setError('')
    setVisible('summary')
    try {
      const res = await window.fetch('/api/llm/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Не удалось получить сводку')
      setSummary(data.summary ?? data.error ?? 'Нет данных')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось получить сводку')
    } finally {
      setLoading(null)
    }
  }

  const fetchPlan = async () => {
    setLoading('plan')
    setPlan(null)
    setError('')
    setVisible('plan')
    try {
      const res = await window.fetch('/api/llm/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Не удалось составить план')
      setPlan({
        intro: data.intro ?? 'План готов.',
        items: Array.isArray(data.items) ? data.items : [],
        later: Array.isArray(data.later) ? data.later : [],
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось составить план')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            ✦
          </span>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              AI-планировщик
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Составит порядок работы по всем задачам
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchPlan}
            disabled={loading !== null}
            className="px-3 py-1.5 text-xs rounded-lg text-white font-medium transition-opacity disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            {loading === 'plan' ? (
              <span className="flex items-center gap-1.5">
                <Spinner />
                Планирую
              </span>
            ) : (
              'План дня'
            )}
          </button>
          <button
            type="button"
            onClick={fetchSummary}
            disabled={loading !== null}
            className="px-3 py-1.5 text-xs rounded-lg border font-medium transition-opacity disabled:opacity-60"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
              background: 'var(--surface)',
            }}
          >
            {loading === 'summary' ? (
              <span className="flex items-center gap-1.5">
                <Spinner />
                Анализирую
              </span>
            ) : (
              'Сводка'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="mt-3 pt-3 border-t text-sm leading-relaxed animate-fade-in"
          style={{ borderColor: 'var(--border)', color: '#b91c1c' }}
        >
          {error}
          <button
            type="button"
            onClick={() => setError('')}
            className="block mt-2 text-xs"
            style={{ color: 'var(--accent)' }}
          >
            Скрыть
          </button>
        </div>
      )}

      {visible === 'summary' && summary && (
        <div
          className="mt-3 pt-3 border-t text-sm leading-relaxed animate-fade-in"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          {summary}
          <button
            type="button"
            onClick={() => setVisible(null)}
            className="block mt-2 text-xs"
            style={{ color: 'var(--accent)' }}
          >
            Скрыть
          </button>
        </div>
      )}

      {visible === 'plan' && plan && (
        <div
          className="mt-3 pt-3 border-t animate-fade-in"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {plan.intro}
          </p>

          {plan.items.length > 0 ? (
            <ol className="mt-3 space-y-3">
              {plan.items.map((item, index) => (
                <li
                  key={`${item.taskId}-${index}`}
                  className="flex gap-3 border-t pt-3 first:border-t-0 first:pt-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </p>
                      <span
                        className="text-xs font-medium"
                        style={{ color: PRIORITY_COLOR[item.priority] }}
                      >
                        {PRIORITY_LABELS[item.priority]}
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: STATUS_COLOR[item.status] }}
                      >
                        {STATUS_LABELS[item.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {item.reason}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      <span className="font-semibold">Следующий шаг: </span>
                      {item.nextAction}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              На сегодня нет активных задач для фокуса.
            </p>
          )}

          {plan.later.length > 0 && (
            <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Можно отложить: {plan.later.join(', ')}.
            </p>
          )}

          <button
            type="button"
            onClick={() => setVisible(null)}
            className="mt-3 text-xs"
            style={{ color: 'var(--accent)' }}
          >
            Скрыть
          </button>
        </div>
      )}
    </div>
  )
}
