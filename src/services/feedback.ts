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

export async function fetchFeedback(): Promise<{
  feedback: Feedback[]
  nps: number | null
  avg: number | null
  count: number
  promoters: number
  passives: number
  detractors: number
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
  return parse(
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}
