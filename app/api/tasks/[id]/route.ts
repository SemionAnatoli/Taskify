import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const { title, description, priority, status, dueDate } = body

    if (title !== undefined && title.trim() === '') {
      return NextResponse.json({ error: 'Название не может быть пустым' }, { status: 400 })
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
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
