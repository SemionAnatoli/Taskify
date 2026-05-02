import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PRIORITIES = ['low', 'medium', 'high']
const STATUSES = ['pending', 'in_progress', 'done']

function validateDate(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? undefined : date
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('GET /api/tasks error:', error)
    return NextResponse.json({ error: 'Ошибка получения задач' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, category, priority, status, dueDate } = body

    if (typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 })
    }

    if (priority && !PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: 'Некорректный приоритет' }, { status: 400 })
    }

    if (status && !STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Некорректный статус' }, { status: 400 })
    }

    const parsedDueDate = validateDate(dueDate)
    if (parsedDueDate === undefined) {
      return NextResponse.json({ error: 'Некорректная дата срока' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() || null : null,
        category: typeof category === 'string' ? category.trim() || null : null,
        priority: priority || 'medium',
        status: status || 'pending',
        dueDate: parsedDueDate,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('POST /api/tasks error:', error)
    return NextResponse.json({ error: 'Ошибка создания задачи' }, { status: 500 })
  }
}
