import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// POST /api/llm/summary — сводка рабочей нагрузки (US-6)
export async function POST(req: NextRequest) {
  try {
    const { tasks } = await req.json()

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ summary: 'Список задач пуст. Добавьте задачи для получения сводки.' })
    }

    const priorityMap: Record<string, string> = { low: 'низкий', medium: 'средний', high: 'высокий' }
    const statusMap: Record<string, string> = { pending: 'ожидает', in_progress: 'в работе', done: 'готово' }

    const taskList = tasks
      .map(
        (t: { title: string; priority: string; status: string; dueDate?: string }, i: number) =>
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

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Ты дружелюбный ассистент менеджера задач. Говоришь кратко, по делу, на русском языке.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 400,
    })

    const summary = completion.choices[0]?.message?.content || ''
    return NextResponse.json({ summary })
  } catch (error) {
    console.error('LLM summary error:', error)
    return NextResponse.json({ error: 'Ошибка получения сводки' }, { status: 500 })
  }
}
