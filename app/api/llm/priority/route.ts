import { NextRequest, NextResponse } from 'next/server'
import { askLlama, parseLlamaJson } from '@/lib/llama'
import { suggestPriority } from '@/lib/taskHeuristics'
import type { Priority } from '@/lib/types'

type PriorityResult = {
  priority: Priority
  reason: string
}

// POST /api/llm/priority — предложение приоритета (US-5)
export async function POST(req: NextRequest) {
  let payload: { title?: string; description?: string | null; dueDate?: string | null } = {}

  try {
    payload = await req.json()
    const { title, description, dueDate } = payload

    if (!title) {
      return NextResponse.json({ error: 'Название задачи обязательно' }, { status: 400 })
    }

    const dueDateStr = dueDate
      ? `Срок выполнения: ${new Date(dueDate).toLocaleDateString('ru-RU')}`
      : 'Срок не указан'

    const prompt = `Ты — умный ассистент менеджера задач. Предложи приоритет для задачи.

Задача: "${title}"
Описание: "${description || 'не указано'}"
${dueDateStr}
Сегодняшняя дата: ${new Date().toLocaleDateString('ru-RU')}

Варианты приоритета: low (низкий), medium (средний), high (высокий)

Ответь ТОЛЬКО JSON-объектом без лишнего текста:
{"priority": "low|medium|high", "reason": "краткое объяснение (1-2 предложения)"}`

    const { text, model } = await askLlama({
      system: 'Ты помощник для управления задачами. Отвечай только валидным JSON без markdown-блоков.',
      prompt,
      temperature: 0.3,
      maxTokens: 200,
    })
    const result = parseLlamaJson<PriorityResult>(text)

    return NextResponse.json({ ...result, source: 'llama', model })
  } catch (error) {
    console.error('LLM priority error:', error)
    if (payload.title) {
      return NextResponse.json({ ...suggestPriority(payload.title, payload.description, payload.dueDate), source: 'local' })
    }
    return NextResponse.json({ error: 'Ошибка LLM приоритизации' }, { status: 500 })
  }
}
