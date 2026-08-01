import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchBoostdesk(): Promise<any> {
  return parse(await fetch('/api/boostdesk', { headers: authHeaders() }))
}
export async function createBoostdesk(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/boostdesk', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchBoostdesk(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/boostdesk/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
