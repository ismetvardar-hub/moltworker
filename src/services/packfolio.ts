import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPackfolio(): Promise<any> {
  return parse(await fetch('/api/packfolio', { headers: authHeaders() }))
}
export async function createPackfolio(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/packfolio', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchPackfolio(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/packfolio/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
