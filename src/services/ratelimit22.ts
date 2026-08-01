import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchRatelimit22(): Promise<any> {
  return parse(await fetch('/api/ratelimit22', { headers: authHeaders() }))
}
export async function createRatelimit22(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/ratelimit22', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchRatelimit22(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/ratelimit22/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
