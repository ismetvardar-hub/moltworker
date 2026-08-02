import { authHeaders } from './auth'

export type LostFoundItem = {
  id: string
  item: string
  venueId: string
  location: string
  status: string
  foundBy: string
  claimant: string | null
  note: string
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

export async function fetchLostFound(): Promise<{
  items: LostFoundItem[]
  total: number
  stored: number
  returned: number
  storedTooLong?: number
  missingLocation?: number
  returnedWithoutClaimant?: number
  flags?: unknown[]
  summary?: Record<string, unknown>
  summaryLines?: string[]
  title?: string
}> {
  return parse(await fetch('/api/lost-found', { headers: authHeaders() }))
}

export async function createLostFound(input: {
  item: string
  venueId?: string
  location?: string
  note?: string
}): Promise<{ item: LostFoundItem }> {
  return parse(
    await fetch('/api/lost-found', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}

export async function runLostfoundSweep(body: Record<string, unknown> = {}) {
  return post('/api/lost-found/sweep', body)
}

export async function ackLostfoundFlag(body: Record<string, unknown> = {}) {
  return post('/api/lost-found/flag/ack', body)
}

export async function returnLostFoundItem(body: Record<string, unknown> = {}) {
  return post('/api/lost-found/return', body)
}

export async function relocateLostFoundItem(body: Record<string, unknown> = {}) {
  return post('/api/lost-found/relocate', body)
}

export async function seedAgingLostFoundItem(body: Record<string, unknown> = {}) {
  return post('/api/lost-found/aging/seed', body)
}

export async function updateLostFound(
  id: string,
  patch: Partial<LostFoundItem>,
): Promise<{ item: LostFoundItem }> {
  return parse(
    await fetch(`/api/lost-found/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch),
    }),
  )
}
