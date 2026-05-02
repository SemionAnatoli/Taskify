type LlamaRequest = {
  system: string
  prompt: string
  temperature?: number
  maxTokens?: number
}

type OllamaModel = {
  name?: string
  model?: string
}

const OLLAMA_ORIGIN = 'http://127.0.0.1:11434'
const PREFERRED_LLAMA_MODELS = ['llama3.3', 'llama3.2', 'llama3.1', 'llama3', 'llama2', 'llama']

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 20_000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function getAvailableModels() {
  const res = await fetchWithTimeout(`${OLLAMA_ORIGIN}/api/tags`, {}, 2_500)

  if (!res.ok) {
    throw new Error('Ollama не отвечает')
  }

  const data = await res.json() as { models?: OllamaModel[] }
  return (data.models ?? [])
    .map((item) => item.name ?? item.model ?? '')
    .filter(Boolean)
}

async function resolveLlamaModel() {
  const models = await getAvailableModels()
  const preferred = PREFERRED_LLAMA_MODELS
    .map((candidate) => models.find((model) => model.toLowerCase().startsWith(candidate)))
    .find(Boolean)

  const anyLlama = models.find((model) => model.toLowerCase().includes('llama'))
  const model = preferred ?? anyLlama

  if (!model) {
    throw new Error('В Ollama не найдена Llama-модель')
  }

  return model
}

export async function askLlama({
  system,
  prompt,
  temperature = 0.4,
  maxTokens = 400,
}: LlamaRequest) {
  const model = await resolveLlamaModel()
  const res = await fetchWithTimeout(`${OLLAMA_ORIGIN}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      options: {
        temperature,
        num_predict: maxTokens,
      },
    }),
  })

  if (!res.ok) {
    throw new Error(`Ollama вернула ошибку ${res.status}`)
  }

  const data = await res.json() as { message?: { content?: string }; response?: string }
  const text = data.message?.content ?? data.response ?? ''

  if (!text.trim()) {
    throw new Error('Llama вернула пустой ответ')
  }

  return {
    text: text.trim(),
    model,
  }
}

export function parseLlamaJson<T>(text: string): T {
  const withoutFence = text.replace(/```json|```/g, '').trim()
  const start = withoutFence.indexOf('{')
  const end = withoutFence.lastIndexOf('}')
  const json = start >= 0 && end >= start ? withoutFence.slice(start, end + 1) : withoutFence

  return JSON.parse(json) as T
}
