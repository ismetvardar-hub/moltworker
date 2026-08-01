import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchKudos(): Promise<any> {
  return parse(await fetch('/api/kudos', { headers: authHeaders() }))
}

export async function createKudos(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/kudos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  }))
}






