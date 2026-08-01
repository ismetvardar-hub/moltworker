import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPowercut(): Promise<any> {
  return parse(await fetch('/api/powercut', { headers: authHeaders() }))
}
export async function createPowercut(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/powercut', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchPowercut(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/powercut/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
