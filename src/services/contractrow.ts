import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchContractrow(): Promise<any> {
  return parse(await fetch('/api/contractrow', { headers: authHeaders() }))
}
export async function createContractrow(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/contractrow', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchContractrow(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/contractrow/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
