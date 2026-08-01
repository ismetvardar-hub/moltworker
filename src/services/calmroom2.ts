import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCalmroom2(): Promise<any> {
  return parse(await fetch('/api/calmroom2', { headers: authHeaders() }))
}
export async function createCalmroom2(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/calmroom2', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchCalmroom2(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/calmroom2/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
