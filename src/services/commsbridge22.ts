import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCommsbridge22(): Promise<any> {
  return parse(await fetch('/api/commsbridge22', { headers: authHeaders() }))
}
export async function createCommsbridge22(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/commsbridge22', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchCommsbridge22(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/commsbridge22/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
