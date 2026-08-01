import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchDuneops(): Promise<any> {
  return parse(await fetch('/api/duneops', { headers: authHeaders() }))
}
export async function createDuneops(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/duneops', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchDuneops(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/duneops/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
