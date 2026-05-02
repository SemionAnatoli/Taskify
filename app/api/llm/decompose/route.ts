import { NextRequest, NextResponse } from 'next/server'
import { askLlama, parseLlamaJson } from '@/lib/llama'
import { decomposeTask } from '@/lib/taskHeuristics'

type DecomposeResult = {
  subtasks: string[]
}

// POST /api/llm/decompose — декомпозиция задачи на подзадачи (US-4)
export async function POST(req: NextRequest) {
  let payload: { title?: string; description?: string | null } = {}

  try {
    payload = await req.json()
    const { title, description } = payload

    if (!title) {
      return NextResponse.json({ error: 'Название задачи обязательно' }, { status: 400 })
    }

    const prompt = `Ты — умный ассистент менеджера задач. Разбей сложную задачу на 3-5 конкретных выполнимых подзадач.

Задача: "${title}"
Описание: "${description || 'не указано'}"

Ответь ТОЛЬКО JSON-объектом без лишнего текста:
{"subtasks": ["подзадача 1", "подзадача 2", "подзадача 3"]}`

    const { text, model } = await askLlama({
      system: 'Ты помощник для управления задачами. Отвечай только валидным JSON без markdown-блоков.',
      prompt,
      temperature: 0.5,
      maxTokens: 300,
    })
    const result = parseLlamaJson<DecomposeResult>(text)

    return NextResponse.json({ ...result, source: 'llama', model })
  } catch (error) {
    console.error('LLM decompose error:', error)
    if (payload.title) {
      return NextResponse.json({ subtasks: decomposeTask(payload.title, payload.description), source: 'local' })
    }
    return NextResponse.json({ error: 'Ошибка LLM декомпозиции' }, { status: 500 })
  }
}
