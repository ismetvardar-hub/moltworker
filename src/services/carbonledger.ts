import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCarbonledger(): Promise<any> {
  return parse(await fetch('/api/carbonledger', { headers: authHeaders() }))
}
export async function createCarbonledger(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/carbonledger', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchCarbonledger(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/carbonledger/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
