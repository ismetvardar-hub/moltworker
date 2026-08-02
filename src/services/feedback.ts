import { authHeaders } from './auth'

export type Feedback = {
  id: string
  score: number
  channel: string
  guestName: string
  venueId: string | null
  brandId?: string
  comment: string
  tags: string[]
  at: string
}

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

export async function fetchFeedback(): Promise<{
  feedback: Feedback[]
  nps: number | null
  avg: number | null
  count: number
  promoters: number
  passives: number
  detractors: number
  summary?: Record<string, unknown>
  flags?: unknown[]
  title?: string
}> {
  return parse(await fetch('/api/feedback', { headers: authHeaders() }))
}

export async function createFeedback(input: {
  score: number
  guestName?: string
  comment?: string
  channel?: string
  venueId?: string
}): Promise<{ feedback: Feedback }> {
  return post<{ feedback: Feedback }>('/api/feedback', input)
}

export async function runFeedbackSweep(body: Record<string, unknown> = {}) {
  return post('/api/feedback/sweep', body)
}

export async function ackFeedbackFlag(body: Record<string, unknown> = {}) {
  return post('/api/feedback/flag/ack', body)
}

export async function seedNpsFeedback(body: Record<string, unknown> = {}) {
  return post('/api/feedback/nps/seed', body)
}

export async function flagLowScores(body: Record<string, unknown> = {}) {
  return post('/api/feedback/low/flag', body)
}

export async function archiveFeedbackFlags(body: Record<string, unknown> = {}) {
  return post('/api/feedback/flags/archive', body)
}
