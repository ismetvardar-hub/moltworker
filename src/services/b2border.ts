import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchB2border(): Promise<any> {
  return parse(await fetch('/api/b2border', { headers: authHeaders() }))
}
export async function createB2border(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/b2border', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchB2border(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/b2border/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
