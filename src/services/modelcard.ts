import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchModelcard(): Promise<any> {
  return parse(await fetch('/api/modelcard', { headers: authHeaders() }))
}
export async function createModelcard(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/modelcard', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchModelcard(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/modelcard/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
