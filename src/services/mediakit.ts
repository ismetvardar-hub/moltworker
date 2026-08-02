import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchMediakit(): Promise<any> {
  return parse(await fetch('/api/mediakit', { headers: authHeaders() }))
}
export async function createMediakit(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/mediakit', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchMediakit(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/mediakit/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postMediakit(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runMediakitSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postMediakit('/api/mediakit/sweep', body)
}
export async function ackMediakitFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postMediakit('/api/mediakit/flag/ack', body)
}
export async function markMediakitOutdatedAsset(body: Record<string, unknown> = {}): Promise<any> {
  return postMediakit('/api/mediakit/asset/outdated', body)
}
export async function publishMediakitKit(body: Record<string, unknown> = {}): Promise<any> {
  return postMediakit('/api/mediakit/publish', body)
}
export async function seedPressDrop(body: Record<string, unknown> = {}): Promise<any> {
  return postMediakit('/api/mediakit/press-drop/seed', body)
}
