import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchEvcharger(): Promise<any> {
  return parse(await fetch('/api/evcharger', { headers: authHeaders() }))
}
export async function createEvcharger(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/evcharger', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchEvcharger(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/evcharger/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
