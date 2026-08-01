import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchMoodlight(): Promise<any> {
  return parse(await fetch('/api/moodlight', { headers: authHeaders() }))
}
export async function createMoodlight(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/moodlight', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchMoodlight(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/moodlight/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
