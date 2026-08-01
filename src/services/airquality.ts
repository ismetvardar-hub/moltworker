import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchAirquality(): Promise<any> {
  return parse(await fetch('/api/airquality', { headers: authHeaders() }))
}
export async function createAirquality(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/airquality', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchAirquality(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/airquality/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
