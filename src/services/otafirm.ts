import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchOtafirm(): Promise<any> {
  return parse(await fetch('/api/otafirm', { headers: authHeaders() }))
}
export async function createOtafirm(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/otafirm', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchOtafirm(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/otafirm/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
