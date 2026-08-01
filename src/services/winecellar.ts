import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchWinecellar(): Promise<any> {
  return parse(await fetch('/api/winecellar', { headers: authHeaders() }))
}
export async function createWinecellar(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/winecellar', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchWinecellar(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/winecellar/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
