import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchIdproof3(): Promise<any> {
  return parse(await fetch('/api/idproof3', { headers: authHeaders() }))
}
export async function createIdproof3(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/idproof3', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchIdproof3(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/idproof3/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
