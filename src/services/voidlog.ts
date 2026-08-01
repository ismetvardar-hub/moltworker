import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchVoidlog(): Promise<any> {
  return parse(await fetch('/api/voidlog', { headers: authHeaders() }))
}
export async function createVoidlog(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/voidlog', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchVoidlog(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/voidlog/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
