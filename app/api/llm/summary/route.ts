import { NextRequest, NextResponse } from 'next/server'
import { askLlama } from '@/lib/llama'
import { summarizeTasks } from '@/lib/taskHeuristics'
import type { Task } from '@/lib/types'

// POST /api/llm/summary — сводка рабочей нагрузки (US-6)
export async function POST(req: NextRequest) {
  let payload: { tasks?: Task[] } = {}

  try {
    payload = await req.json() as { tasks?: Task[] }
    const { tasks } = payload

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ summary: 'Список задач пуст. Добавьте задачи для получения сводки.' })
    }

    const priorityMap: Record<string, string> = { low: 'низкий', medium: 'средний', high: 'высокий' }
    const statusMap: Record<string, string> = { pending: 'ожидает', in_progress: 'в работе', done: 'готово' }

    const taskList = tasks
      .map(
        (t, i) =>
          `${i + 1}. "${t.title}" — приоритет: ${priorityMap[t.priority] || t.priority}, статус: ${statusMap[t.status] || t.status}${
            t.dueDate ? `, срок: ${new Date(t.dueDate).toLocaleDateString('ru-RU')}` : ''
          }`
      )
      .join('\n')

    const prompt = `Ты — умный ассистент менеджера задач. Составь краткую естественно-языковую сводку рабочей нагрузки пользователя.

Список задач:
${taskList}

Сегодня: ${new Date().toLocaleDateString('ru-RU')}

Напиши сводку в 3-5 предложениях: сколько задач, какие срочные, какое распределение нагрузки, что стоит сделать в первую очередь.`

    const { text, model } = await askLlama({
      system: 'Ты дружелюбный ассистент менеджера задач. Говоришь кратко, по делу, на русском языке.',
      prompt,
      temperature: 0.6,
      maxTokens: 400,
    })

    return NextResponse.json({ summary: text, source: 'llama', model })
  } catch (error) {
    console.error('LLM summary error:', error)
    return NextResponse.json({ summary: summarizeTasks(payload.tasks ?? []), source: 'local' })
  }
}
