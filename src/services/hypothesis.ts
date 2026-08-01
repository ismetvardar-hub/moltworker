import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchHypothesis(): Promise<any> {
  return parse(await fetch('/api/hypothesis', { headers: authHeaders() }))
}
export async function createHypothesis(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/hypothesis', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchHypothesis(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/hypothesis/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
