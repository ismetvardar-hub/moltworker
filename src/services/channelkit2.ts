import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchChannelkit2(): Promise<any> {
  return parse(await fetch('/api/channelkit2', { headers: authHeaders() }))
}
export async function createChannelkit2(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/channelkit2', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchChannelkit2(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/channelkit2/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
