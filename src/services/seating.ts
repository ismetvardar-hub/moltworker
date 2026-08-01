import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchSeating(): Promise<any> {
  return parse(await fetch('/api/seating', { headers: authHeaders() }))
}

export async function createSeating(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/seating', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  }))
}

export async function patchSeating(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/seating/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch),
  }))
}




