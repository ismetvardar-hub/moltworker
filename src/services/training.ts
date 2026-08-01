import { authHeaders } from './auth'

export type QuizSummary = { id: string; title: string; questionCount: number }
export type QuizQuestion = { id: string; prompt: string; options: string[] }
export type Attempt = {
  id: string
  quizTitle: string
  person: string
  score: number
  correct: number
  total: number
  at: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchTraining(): Promise<{
  quizzes: QuizSummary[]
  attempts: Attempt[]
  avgScore: number | null
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
