import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchChannelmgr(): Promise<any> {
  return parse(await fetch('/api/channelmgr', { headers: authHeaders() }))
}
export async function createChannelmgr(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/channelmgr', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchChannelmgr(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/channelmgr/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
