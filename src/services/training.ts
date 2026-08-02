import { authHeaders } from './auth'

export type QuizSummary = { id: string; title: string; questionCount: number }
export type QuizQuestion = { id: string; prompt: string; options: string[] }
export type Attempt = {
  id: string
  quizTitle: string
  person: string
  status?: string
  score?: number
  correct?: number
  total?: number
  at: string
}
export type TrainingFlag = { id: string; key: string; level: string; text: string; status: string }

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

async function post<T = unknown>(path: string, body: Record<string, unknown> = {}) {
  return parse<T>(
    await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function fetchTraining(): Promise<{
  quizzes: QuizSummary[]
  attempts: Attempt[]
  attemptCount?: number
  incompleteAttempts?: number
  noAttemptQuizzes?: number
  staleIncomplete?: number
  avgScore: number | null
  flags?: TrainingFlag[]
  summary?: Record<string, unknown>
  summaryLines?: string[]
  title?: string
}> {
  return parse(await fetch('/api/training', { headers: authHeaders() }))
}

export async function fetchQuiz(id: string): Promise<{ quiz: { id: string; title: string; questions: QuizQuestion[] } }> {
  return parse(await fetch(`/api/training/${encodeURIComponent(id)}/quiz`, { headers: authHeaders() }))
}

export async function submitTrainingAttempt(input: {
  quizId: string
  answers: Record<string, number>
  person?: string
}): Promise<{ attempt: Attempt }> {
  return parse(
    await fetch('/api/training/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}

export async function runTrainingSweep(body: Record<string, unknown> = {}) {
  return post('/api/training/sweep', body)
}

export async function ackTrainingFlag(body: Record<string, unknown> = {}) {
  return post('/api/training/flag/ack', body)
}

export async function startTrainingAttempt(body: Record<string, unknown> = {}) {
  return post('/api/training/attempt/start', body)
}

export async function completeTrainingAttempt(body: Record<string, unknown> = {}) {
  return post('/api/training/attempt/complete', body)
}

export async function seedLowScoreTrainingAttempt(body: Record<string, unknown> = {}) {
  return post('/api/training/attempt/low-score/seed', body)
}
