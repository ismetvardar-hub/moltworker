import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCoinvest2(): Promise<any> {
  return parse(await fetch('/api/coinvest2', { headers: authHeaders() }))
}
export async function createCoinvest2(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/coinvest2', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchCoinvest2(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/coinvest2/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
