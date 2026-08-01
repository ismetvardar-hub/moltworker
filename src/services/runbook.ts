import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchRunbook(): Promise<any> {
  return parse(await fetch('/api/runbook', { headers: authHeaders() }))
}
export async function createRunbook(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/runbook', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchRunbook(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/runbook/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
