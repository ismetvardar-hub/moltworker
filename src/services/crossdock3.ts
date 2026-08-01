import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCrossdock3(): Promise<any> {
  return parse(await fetch('/api/crossdock3', { headers: authHeaders() }))
}
export async function createCrossdock3(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/crossdock3', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchCrossdock3(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/crossdock3/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
