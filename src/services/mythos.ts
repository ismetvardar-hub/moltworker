import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchMythos(): Promise<any> {
  return parse(await fetch('/api/mythos', { headers: authHeaders() }))
}
export async function createMythos(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/mythos', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchMythos(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/mythos/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
