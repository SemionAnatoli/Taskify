'use client'

import { useState } from 'react'
import { Task, Priority, Status, PRIORITY_LABELS, STATUS_LABELS } from '@/lib/types'
import LlmPanel from './LlmPanel'

interface Props {
  task: Task
  onUpdate: (id: string, data: Partial<Task>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (task: Task) => void
  onApplyCategory: (id: string, category: string) => Promise<void>
  onCreateSubtasks: (parentTitle: string, subtasks: string[]) => Promise<void>
}

const PRIORITY_BORDER: Record<Priority, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
}

const STATUS_CHIP: Record<Status, { bg: string; color: string }> = {
  pending:     { bg: '#f3f4f6', color: '#6b7280' },
  in_progress: { bg: '#e0f2fe', color: '#0284c7' },
  done:        { bg: '#d1fae5', color: '#059669' },
}

const STATUS_DOT: Record<Status, { border: string; bg: string; icon: 'none' | 'dash' | 'check' }> = {
  pending: { border: '#ef4444', bg: 'transparent', icon: 'none' },
  in_progress: { border: '#0ea5e9', bg: '#0ea5e9', icon: 'dash' },
  done: { border: '#10b981', bg: '#10b981', icon: 'check' },
}

export default function TaskCard({ task, onUpdate, onDelete, onEdit, onApplyCategory, onCreateSubtasks }: Props) {
  const [showLlm, setShowLlm] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOverdue =
    task.dueDate &&
    task.status !== 'done' &&
    new Date(task.dueDate) < new Date()

  const chip = STATUS_CHIP[task.status]
  const dot = STATUS_DOT[task.status]

  const nextStatus: Record<Status, Status> = {
    pending: 'in_progress',
    in_progress: 'done',
    done: 'pending',
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(task.id)
    } catch {
      // Ошибка уже отображается на уровне страницы.
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusToggle = () => {
    const next = nextStatus[task.status]
    void onUpdate(task.id, { status: next }).catch(() => undefined)
  }

  const stopCardToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      data-testid="task-card"
      role="button"
      tabIndex={0}
      onClick={handleStatusToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleStatusToggle()
        }
      }}
      aria-label={`Сменить статус задачи ${task.title}. Текущий статус: ${STATUS_LABELS[task.status]}`}
      className="group relative flex cursor-pointer rounded-xl border overflow-hidden animate-slide-in transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      title="Нажмите, чтобы сменить статус"
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
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleStatusToggle()
            }}
            className="mt-0.5 shrink-0 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all"
            style={{
              borderColor: dot.border,
              background: dot.bg,
            }}
            title="Сменить статус"
            aria-label={`Сменить статус задачи ${task.title}`}
          >
            {dot.icon === 'check' && (
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {dot.icon === 'dash' && (
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M3 6h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
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

              {task.category && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}
                >
                  {task.category}
                </span>
              )}

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
          <div className="flex items-center gap-1 shrink-0" onClick={stopCardToggle}>
            <button
              type="button"
              onClick={() => setShowLlm((v) => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-sm"
              style={{
                background: showLlm ? 'var(--accent)' : 'transparent',
                color: showLlm ? '#fff' : 'var(--text-secondary)',
              }}
              title="Ассистент"
              aria-label={`${showLlm ? 'Скрыть' : 'Открыть'} ассистента для задачи ${task.title}`}
            >
              ✦
            </button>
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="Редактировать"
              aria-label={`Редактировать задачу ${task.title}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="Удалить"
              aria-label={`Удалить задачу ${task.title}`}
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
          <div onClick={stopCardToggle}>
            <LlmPanel
              task={task}
              onApplyCategory={(category) => { void onApplyCategory(task.id, category).catch(() => undefined) }}
              onApplyPriority={(p) => { void onUpdate(task.id, { priority: p }).catch(() => undefined) }}
              onApplySubtasks={(s) => { void onCreateSubtasks(task.title, s).catch(() => undefined) }}
              onClose={() => setShowLlm(false)}
            />
          </div>
        )}

        {/* Delete confirm */}
        {showConfirm && (
          <div
            onClick={stopCardToggle}
            className="mt-3 pt-3 border-t flex items-center justify-between animate-fade-in"
            style={{ borderColor: 'var(--border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Удалить эту задачу?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1 text-xs rounded-lg text-white font-medium disabled:opacity-50"
                style={{ background: '#ef4444' }}
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
              <button
                type="button"
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
