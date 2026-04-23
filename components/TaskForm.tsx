'use client'

import { useState } from 'react'
import { Task, Priority, Status } from '@/lib/types'

interface Props {
  task?: Task
  onSave: (data: Partial<Task>) => Promise<void>
  onCancel: () => void
}

export default function TaskForm({ task, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [status, setStatus] = useState<Status>(task?.status ?? 'pending')
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Название обязательно')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ title: title.trim(), description: description.trim() || undefined, priority, status, dueDate: dueDate || null })
    } catch {
      setError('Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: 'high', label: 'Высокий', color: '#ef4444' },
    { value: 'medium', label: 'Средний', color: '#f59e0b' },
    { value: 'low', label: 'Низкий', color: '#10b981' },
  ]

  const statusOptions: { value: Status; label: string }[] = [
    { value: 'pending', label: 'Ожидает' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'done', label: 'Готово' },
  ]

  const labelClass = 'block text-xs font-medium mb-1.5'
  const inputClass =
    'w-full px-3 py-2 text-sm rounded-lg border transition-colors outline-none focus:ring-2'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
          Название <span style={{ color: 'var(--priority-high)' }}>*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Что нужно сделать?"
          autoFocus
          className={inputClass}
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      <div>
        <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
          Описание
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Дополнительные детали..."
          rows={3}
          className={inputClass + ' resize-none'}
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
            Приоритет
          </label>
          <div className="flex gap-1.5">
            {priorityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className="flex-1 py-1.5 text-xs rounded-lg border transition-all font-medium"
                style={{
                  borderColor: priority === opt.value ? opt.color : 'var(--border)',
                  background: priority === opt.value ? opt.color + '15' : 'transparent',
                  color: priority === opt.value ? opt.color : 'var(--text-secondary)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
            Статус
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className={inputClass}
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--card)' }}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
          Срок выполнения
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={inputClass}
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      {error && <p className="text-xs" style={{ color: 'var(--priority-high)' }}>{error}</p>}

      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 text-sm rounded-lg text-white font-medium transition-opacity disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {saving ? 'Сохранение...' : task ? 'Сохранить' : 'Создать'}
        </button>
      </div>
    </form>
  )
}
