import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchFxdesk(): Promise<any> {
  return parse(await fetch('/api/fxdesk', { headers: authHeaders() }))
}
export async function createFxdesk(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/fxdesk', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchFxdesk(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/fxdesk/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
