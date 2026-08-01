import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchNetsplit3(): Promise<any> {
  return parse(await fetch('/api/netsplit3', { headers: authHeaders() }))
}
export async function createNetsplit3(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/netsplit3', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchNetsplit3(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/netsplit3/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
