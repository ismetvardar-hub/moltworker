import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCorrective(): Promise<any> {
  return parse(await fetch('/api/corrective', { headers: authHeaders() }))
}
export async function createCorrective(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/corrective', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchCorrective(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/corrective/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
