import { authHeaders } from './auth'

export type HandoverNote = {
  id: string
  venueId: string
  fromShift: string
  toShift: string
  author: string
  body: string
  priority: string
  at: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchHandover(): Promise<{ notes: HandoverNote[]; today: number; high: number }> {
  return parse(await fetch('/api/handover', { headers: authHeaders() }))
}

export async function createHandover(input: {
  body: string
  venueId?: string
  fromShift?: string
  toShift?: string
  priority?: string
  author?: string
}): Promise<{ note: HandoverNote }> {
  return parse(
    await fetch('/api/handover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}
