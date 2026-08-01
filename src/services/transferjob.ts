import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchTransferjob(): Promise<any> {
  return parse(await fetch('/api/transferjob', { headers: authHeaders() }))
}
export async function createTransferjob(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/transferjob', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchTransferjob(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/transferjob/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
