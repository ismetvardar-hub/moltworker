import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchSuccession(): Promise<any> {
  return parse(await fetch('/api/succession', { headers: authHeaders() }))
}
export async function createSuccession(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/succession', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchSuccession(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/succession/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
