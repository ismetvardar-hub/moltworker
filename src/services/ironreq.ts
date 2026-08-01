import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchIronreq(): Promise<any> {
  return parse(await fetch('/api/ironreq', { headers: authHeaders() }))
}
export async function createIronreq(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/ironreq', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchIronreq(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/ironreq/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
