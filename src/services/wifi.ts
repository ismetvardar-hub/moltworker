import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchWifi(): Promise<any> {
  return parse(await fetch('/api/wifi', { headers: authHeaders() }))
}
export async function createWifi(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/wifi', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(input) }))
}
export async function patchWifi(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/wifi/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) }))
}
