import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchHours(): Promise<any> {
  return parse(await fetch('/api/hours', { headers: authHeaders() }))
}





export async function patchHours(venueId: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/hours/${encodeURIComponent(venueId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch),
  }))
}


