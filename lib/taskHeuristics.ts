import type { Priority, Status, Task } from './types'

export interface CategorySuggestion {
  category: string
  reason: string
}

export interface PrioritySuggestion {
  priority: Priority
  reason: string
}

export interface DailyPlanItem {
  taskId: string
  title: string
  reason: string
  nextAction: string
  priority: Priority
  status: Status
}

export interface DailyPlan {
  intro: string
  items: DailyPlanItem[]
  later: string[]
}

const CATEGORY_KEYWORDS: Array<{ category: string; words: string[] }> = [
  { category: 'Работа', words: ['работ', 'проект', 'клиент', 'отчет', 'отчёт', 'презентац', 'релиз', 'заказ'] },
  { category: 'Встречи', words: ['встреч', 'созвон', 'звонок', 'интервью', 'собеседован', 'планерк'] },
  { category: 'Учеба', words: ['учеб', 'курс', 'экзамен', 'лекц', 'домашн', 'задани', 'прочитать'] },
  { category: 'Финансы', words: ['счет', 'счёт', 'оплат', 'банк', 'налог', 'бюджет', 'деньг'] },
  { category: 'Здоровье', words: ['врач', 'здоров', 'трениров', 'спорт', 'лекар', 'анализ'] },
  { category: 'Покупки', words: ['купить', 'заказать', 'магазин', 'доставк', 'товар'] },
  { category: 'Дом', words: ['дом', 'уборк', 'ремонт', 'квартир', 'коммун', 'кухн'] },
]

const HIGH_PRIORITY_WORDS = ['срочно', 'важно', 'критично', 'дедлайн', 'горит', 'сегодня']
const LOW_PRIORITY_WORDS = ['когда-нибудь', 'потом', 'идея', 'почитать', 'изучить']

function normalize(value?: string | null) {
  return (value ?? '').toLowerCase()
}

function daysUntil(date?: string | null) {
  if (!date) return null
  const due = new Date(date)
  if (Number.isNaN(due.getTime())) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000)
}

function dueReason(days: number | null) {
  if (days === null) return null
  if (days < 0) return 'срок уже прошел'
  if (days === 0) return 'срок сегодня'
  if (days === 1) return 'срок завтра'
  if (days <= 7) return `срок через ${days} дн.`
  return null
}

function priorityReason(priority: Priority) {
  const map: Record<Priority, string> = {
    high: 'высокий приоритет',
    medium: 'средний приоритет',
    low: 'низкий приоритет',
  }

  return map[priority]
}

function statusReason(status: Status) {
  const map: Record<Status, string> = {
    pending: 'еще не начата',
    in_progress: 'уже в работе',
    done: 'готова',
  }

  return map[status]
}

function scoreTask(task: Task) {
  const days = daysUntil(task.dueDate)
  let score = 0

  if (task.status === 'in_progress') score += 35
  if (task.priority === 'high') score += 35
  if (task.priority === 'medium') score += 15
  if (task.priority === 'low') score += 4

  if (days !== null && days < 0) score += 60
  else if (days === 0) score += 45
  else if (days === 1) score += 32
  else if (days !== null && days <= 7) score += 18

  const createdAt = new Date(task.createdAt)
  if (!Number.isNaN(createdAt.getTime())) {
    const ageDays = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86_400_000))
    score += Math.min(ageDays, 10)
  }

  return score
}

function buildPlanReason(task: Task) {
  const days = daysUntil(task.dueDate)
  const reasons = [
    dueReason(days),
    statusReason(task.status),
    priorityReason(task.priority),
    task.category ? `категория: ${task.category}` : null,
  ].filter(Boolean)

  return `Эта задача выше в плане, потому что ${reasons.join(', ')}.`
}

function buildNextAction(task: Task) {
  if (task.status === 'in_progress') {
    return 'Продолжить выполнение и довести до ближайшего проверяемого результата.'
  }

  const priority = suggestPriority(task.title, task.description, task.dueDate)
  if (priority.priority === 'high') {
    return 'Сформулировать первый конкретный шаг и начать его сегодня.'
  }

  return 'Выделить короткий следующий шаг, чтобы сдвинуть задачу без перегруза.'
}

export function suggestCategory(title: string, description?: string | null): CategorySuggestion {
  const text = `${normalize(title)} ${normalize(description)}`
  const match = CATEGORY_KEYWORDS.find(({ words }) => words.some((word) => text.includes(word)))

  if (match) {
    return {
      category: match.category,
      reason: `Категория выбрана по ключевым словам задачи: она ближе всего к направлению «${match.category}».`,
    }
  }

  return {
    category: 'Личное',
    reason: 'В задаче нет явных рабочих, учебных или бытовых маркеров, поэтому лучше начать с общей личной категории.',
  }
}

export function suggestPriority(title: string, description?: string | null, dueDate?: string | null): PrioritySuggestion {
  const text = `${normalize(title)} ${normalize(description)}`
  const days = daysUntil(dueDate)

  if (days !== null && days < 0) {
    return { priority: 'high', reason: 'Срок уже прошел, поэтому задачу стоит поднять в высокий приоритет.' }
  }

  if (days !== null && days <= 1) {
    return { priority: 'high', reason: 'Срок выполнения очень близко, задачу лучше закрыть в первую очередь.' }
  }

  if (HIGH_PRIORITY_WORDS.some((word) => text.includes(word))) {
    return { priority: 'high', reason: 'В описании есть признаки срочности или высокой важности.' }
  }

  if (days !== null && days <= 7) {
    return { priority: 'medium', reason: 'Срок находится в ближайшей неделе, задачу стоит держать в активном фокусе.' }
  }

  if (LOW_PRIORITY_WORDS.some((word) => text.includes(word))) {
    return { priority: 'low', reason: 'Формулировка похожа на несрочную задачу без жесткого дедлайна.' }
  }

  return { priority: 'medium', reason: 'Явных признаков срочности нет, поэтому средний приоритет выглядит сбалансированно.' }
}

export function decomposeTask(title: string, description?: string | null): string[] {
  const cleanTitle = title.trim()
  const hasDetails = Boolean(description?.trim())

  return [
    `Уточнить ожидаемый результат: ${cleanTitle}`,
    hasDetails ? 'Разобрать описание и выделить конкретные требования' : 'Собрать недостающие детали и ограничения',
    'Подготовить материалы или инструменты для выполнения',
    `Выполнить основную часть задачи: ${cleanTitle}`,
    'Проверить результат и зафиксировать завершение',
  ]
}

export function summarizeTasks(tasks: Task[]): string {
  if (tasks.length === 0) {
    return 'Список задач пуст. Добавьте задачи, чтобы увидеть сводку нагрузки.'
  }

  const active = tasks.filter((task) => task.status !== 'done')
  const done = tasks.length - active.length
  const high = active.filter((task) => task.priority === 'high')
  const overdue = active.filter((task) => {
    const days = daysUntil(task.dueDate)
    return days !== null && days < 0
  })
  const today = active.filter((task) => daysUntil(task.dueDate) === 0)
  const week = active.filter((task) => {
    const days = daysUntil(task.dueDate)
    return days !== null && days > 0 && days <= 7
  })

  const focusTask = overdue[0] ?? today[0] ?? high[0] ?? week[0] ?? active[0]
  const statusText: Record<Status, string> = {
    pending: 'ожидает',
    in_progress: 'в работе',
    done: 'готово',
  }

  const sentences = [
    `Всего задач: ${tasks.length}; активных: ${active.length}, завершенных: ${done}.`,
    overdue.length > 0
      ? `Просроченных задач: ${overdue.length}, их лучше разобрать в первую очередь.`
      : today.length > 0
        ? `На сегодня запланировано задач: ${today.length}.`
        : 'Просроченных задач сейчас нет.',
    `В ближайшие 7 дней нужно закрыть ${week.length} задач, высокий приоритет имеют ${high.length}.`,
  ]

  if (focusTask) {
    sentences.push(`Первый фокус: «${focusTask.title}» (${statusText[focusTask.status]}, ${focusTask.priority}).`)
  }

  return sentences.join(' ')
}

export function planDay(tasks: Task[]): DailyPlan {
  const active = tasks.filter((task) => task.status !== 'done')

  if (tasks.length === 0) {
    return {
      intro: 'Список задач пуст. Добавьте задачи, и ассистент соберет план дня.',
      items: [],
      later: [],
    }
  }

  if (active.length === 0) {
    return {
      intro: 'Все задачи завершены. На сегодня можно оставить только проверку результата или добавить новые цели.',
      items: [],
      later: [],
    }
  }

  const ordered = [...active].sort((a, b) => scoreTask(b) - scoreTask(a))
  const items = ordered.slice(0, 5).map((task): DailyPlanItem => ({
    taskId: task.id,
    title: task.title,
    reason: buildPlanReason(task),
    nextAction: buildNextAction(task),
    priority: task.priority,
    status: task.status,
  }))

  const later = ordered
    .slice(5, 8)
    .map((task) => task.title)

  return {
    intro: `Я выбрал ${items.length} задач для фокуса на сегодня: сначала срочное и уже начатое, затем важное без дедлайна.`,
    items,
    later,
  }
}
