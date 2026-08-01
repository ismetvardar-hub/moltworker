import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchEstatescan(): Promise<any> {
  return parse(await fetch('/api/estatescan', { headers: authHeaders() }))
}
export async function createEstatescan(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/estatescan', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchEstatescan(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/estatescan/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
