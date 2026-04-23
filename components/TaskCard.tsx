'use client'

import { useState } from 'react'
import { Task, Priority, Status, PRIORITY_LABELS, STATUS_LABELS } from '@/lib/types'
import LlmPanel from './LlmPanel'

interface Props {
  task: Task
  onUpdate: (id: string, data: Partial<Task>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (task: Task) => void
  onCreateSubtasks: (parentTitle: string, subtasks: string[]) => Promise<void>
}

const PRIORITY_BORDER: Record<Priority, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
}

const STATUS_CHIP: Record<Status, { bg: string; color: string }> = {
  pending:     { bg: '#f3f4f6', color: '#6b7280' },
  in_progress: { bg: '#ede9fe', color: '#7c3aed' },
  done:        { bg: '#d1fae5', color: '#059669' },
}

export default function TaskCard({ task, onUpdate, onDelete, onEdit, onCreateSubtasks }: Props) {
  const [showLlm, setShowLlm] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOverdue =
    task.dueDate &&
    task.status !== 'done' &&
    new Date(task.dueDate) < new Date()

  const chip = STATUS_CHIP[task.status]

  const nextStatus: Partial<Record<Status, Status>> = {
    pending: 'in_progress',
    in_progress: 'done',
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(task.id)
  }

  return (
    <div
      className="group relative flex rounded-xl border overflow-hidden animate-slide-in transition-shadow hover:shadow-md"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* Priority strip */}
      <div
        className="w-1 shrink-0"
        style={{ background: PRIORITY_BORDER[task.priority] }}
      />

      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-start gap-3">
          {/* Status toggle */}
          <button
            onClick={() => {
              const next = nextStatus[task.status]
              if (next) onUpdate(task.id, { status: next })
            }}
            className="mt-0.5 shrink-0 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all"
            style={{
              borderColor:
                task.status === 'done'
                  ? '#10b981'
                  : PRIORITY_BORDER[task.priority],
              background: task.status === 'done' ? '#10b981' : 'transparent',
            }}
            title={task.status !== 'done' ? 'Следующий статус' : undefined}
          >
            {task.status === 'done' && (
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium leading-snug"
              style={{
                color: task.status === 'done' ? 'var(--text-secondary)' : 'var(--text-primary)',
                textDecoration: task.status === 'done' ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </p>

            {task.description && (
              <p
                className="text-xs mt-0.5 leading-relaxed line-clamp-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: chip.bg, color: chip.color }}
              >
                {STATUS_LABELS[task.status]}
              </span>

              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: PRIORITY_BORDER[task.priority] + '18',
                  color: PRIORITY_BORDER[task.priority],
                }}
              >
                {PRIORITY_LABELS[task.priority]}
              </span>

              {task.dueDate && (
                <span
                  className="text-xs flex items-center gap-1"
                  style={{ color: isOverdue ? '#ef4444' : 'var(--text-secondary)' }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {new Date(task.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  {isOverdue && ' · просрочено'}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => setShowLlm((v) => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-sm"
              style={{
                background: showLlm ? 'var(--accent)' : 'transparent',
                color: showLlm ? '#fff' : 'var(--text-secondary)',
              }}
              title="Ассистент"
            >
              ✦
            </button>
            <button
              onClick={() => onEdit(task)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="Редактировать"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="Удалить"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        </div>

        {/* LLM panel */}
        {showLlm && (
          <LlmPanel
            task={task}
            onApplyPriority={(p) => onUpdate(task.id, { priority: p })}
            onApplySubtasks={(s) => onCreateSubtasks(task.title, s)}
            onClose={() => setShowLlm(false)}
          />
        )}

        {/* Delete confirm */}
        {showConfirm && (
          <div
            className="mt-3 pt-3 border-t flex items-center justify-between animate-fade-in"
            style={{ borderColor: 'var(--border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Удалить эту задачу?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1 text-xs rounded-lg text-white font-medium disabled:opacity-50"
                style={{ background: '#ef4444' }}
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1 text-xs rounded-lg border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
