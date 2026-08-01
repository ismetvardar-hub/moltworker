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

export async function fetchLostFound(): Promise<{
  items: LostFoundItem[]
  stored: number
  returned: number
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
