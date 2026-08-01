import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchWaste(): Promise<any> {
  return parse(await fetch('/api/waste', { headers: authHeaders() }))
}

export async function createWaste(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/waste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  }))
}






