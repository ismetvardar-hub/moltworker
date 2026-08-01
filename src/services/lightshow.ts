import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchLightshow(): Promise<any> {
  return parse(await fetch('/api/lightshow', { headers: authHeaders() }))
}
export async function createLightshow(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/lightshow', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchLightshow(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/lightshow/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
