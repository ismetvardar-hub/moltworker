import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchTrainwave(): Promise<any> {
  return parse(await fetch('/api/trainwave', { headers: authHeaders() }))
}
export async function createTrainwave(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/trainwave', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchTrainwave(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/trainwave/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
