import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchSocqueue2(): Promise<any> {
  return parse(await fetch('/api/socqueue2', { headers: authHeaders() }))
}
export async function createSocqueue2(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/socqueue2', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchSocqueue2(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/socqueue2/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
