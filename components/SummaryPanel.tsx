'use client'

import { useState } from 'react'
import { Task } from '@/lib/types'

interface Props {
  tasks: Task[]
}

export default function SummaryPanel({ tasks }: Props) {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)

  const fetch = async () => {
    setLoading(true)
    setSummary('')
    setVisible(true)
    try {
      const res = await window.fetch('/api/llm/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      })
      const data = await res.json()
      setSummary(data.summary ?? data.error ?? 'Нет данных')
    } catch {
      setSummary('Не удалось получить сводку')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            ✦
          </span>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Анализ нагрузки
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Ассистент оценит ваши задачи
            </p>
          </div>
        </div>
        <button
          onClick={fetch}
          disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg text-white font-medium transition-opacity disabled:opacity-60"
          style={{ background: 'var(--accent)' }}
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Анализирую
            </span>
          ) : (
            'Получить сводку'
          )}
        </button>
      </div>

      {visible && summary && (
        <div
          className="mt-3 pt-3 border-t text-sm leading-relaxed animate-fade-in"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          {summary}
          <button
            onClick={() => setVisible(false)}
            className="block mt-2 text-xs"
            style={{ color: 'var(--accent)' }}
          >
            Скрыть
          </button>
        </div>
      )}
    </div>
  )
}
