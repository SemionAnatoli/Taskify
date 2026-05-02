import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PRIORITIES = ['low', 'medium', 'high']
const STATUSES = ['pending', 'in_progress', 'done']

function validateDate(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? undefined : date
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 })
    return NextResponse.json(task)
  } catch (error) {
    console.error('GET /api/tasks/[id] error:', error)
    return NextResponse.json({ error: 'Ошибка получения задачи' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, description, category, priority, status, dueDate } = body

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return NextResponse.json({ error: 'Название не может быть пустым' }, { status: 400 })
    }

    if (priority !== undefined && !PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: 'Некорректный приоритет' }, { status: 400 })
    }

    if (status !== undefined && !STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Некорректный статус' }, { status: 400 })
    }

    const parsedDueDate = dueDate !== undefined ? validateDate(dueDate) : undefined
    if (parsedDueDate === undefined && dueDate !== undefined) {
      return NextResponse.json({ error: 'Некорректная дата срока' }, { status: 400 })
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: typeof description === 'string' ? description.trim() || null : null }),
        ...(category !== undefined && { category: typeof category === 'string' ? category.trim() || null : null }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate: parsedDueDate }),
      },
    })

    return NextResponse.json(task)
  } catch (error: unknown) {
    console.error('PUT /api/tasks/[id] error:', error)
    if ((error as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Ошибка обновления задачи' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.task.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('DELETE /api/tasks/[id] error:', error)
    if ((error as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Ошибка удаления задачи' }, { status: 500 })
  }
}
