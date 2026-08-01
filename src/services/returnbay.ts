import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchReturnbay(): Promise<any> {
  return parse(await fetch('/api/returnbay', { headers: authHeaders() }))
}
export async function createReturnbay(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/returnbay', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchReturnbay(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/returnbay/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
