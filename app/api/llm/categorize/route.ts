import { NextRequest, NextResponse } from 'next/server'
import { askLlama, parseLlamaJson } from '@/lib/llama'
import { suggestCategory } from '@/lib/taskHeuristics'

type CategoryResult = {
  category: string
  reason: string
}

// POST /api/llm/categorize — умная категоризация задачи (US-3)
export async function POST(req: NextRequest) {
  let payload: { title?: string; description?: string | null } = {}

  try {
    payload = await req.json()
    const { title, description } = payload

    if (!title) {
      return NextResponse.json({ error: 'Название задачи обязательно' }, { status: 400 })
    }

    const prompt = `Ты — умный ассистент менеджера задач. Предложи одну категорию (тег) для задачи.

Задача: "${title}"
Описание: "${description || 'не указано'}"

Ответь ТОЛЬКО JSON-объектом без лишнего текста:
{"category": "название категории", "reason": "краткое объяснение (1 предложение)"}

Примеры категорий: Работа, Учёба, Личное, Здоровье, Финансы, Покупки, Дом, Проект, Встречи`

    const { text, model } = await askLlama({
      system: 'Ты помощник для управления задачами. Отвечай только валидным JSON без markdown-блоков.',
      prompt,
      temperature: 0.3,
      maxTokens: 150,
    })
    const result = parseLlamaJson<CategoryResult>(text)

    return NextResponse.json({ ...result, source: 'llama', model })
  } catch (error) {
    console.error('LLM categorize error:', error)
    if (payload.title) {
      return NextResponse.json({ ...suggestCategory(payload.title, payload.description), source: 'local' })
    }
    return NextResponse.json({ error: 'Ошибка LLM категоризации' }, { status: 500 })
  }
}
