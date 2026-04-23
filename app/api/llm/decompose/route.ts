import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// POST /api/llm/decompose — декомпозиция задачи на подзадачи (US-4)
export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json()

    if (!title) {
      return NextResponse.json({ error: 'Название задачи обязательно' }, { status: 400 })
    }

    const prompt = `Ты — умный ассистент менеджера задач. Разбей сложную задачу на 3-5 конкретных выполнимых подзадач.

Задача: "${title}"
Описание: "${description || 'не указано'}"

Ответь ТОЛЬКО JSON-объектом без лишнего текста:
{"subtasks": ["подзадача 1", "подзадача 2", "подзадача 3"]}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Ты помощник для управления задачами. Отвечай только валидным JSON без markdown-блоков.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 300,
    })

    const text = completion.choices[0]?.message?.content || ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)

    return NextResponse.json(result)
  } catch (error) {
    console.error('LLM decompose error:', error)
    return NextResponse.json({ error: 'Ошибка LLM декомпозиции' }, { status: 500 })
  }
}
