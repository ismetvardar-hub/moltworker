import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchColdsite2(): Promise<any> {
  return parse(await fetch('/api/coldsite2', { headers: authHeaders() }))
}
export async function createColdsite2(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/coldsite2', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchColdsite2(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/coldsite2/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
