import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// POST /api/llm/priority — предложение приоритета (US-5)
export async function POST(req: NextRequest) {
  try {
    const { title, description, dueDate } = await req.json()

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

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Ты помощник для управления задачами. Отвечай только валидным JSON без markdown-блоков.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 200,
    })

    const text = completion.choices[0]?.message?.content || ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)

    return NextResponse.json(result)
  } catch (error) {
    console.error('LLM priority error:', error)
    return NextResponse.json({ error: 'Ошибка LLM приоритизации' }, { status: 500 })
  }
}
