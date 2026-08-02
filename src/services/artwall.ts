import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchArtwall(): Promise<any> {
  return parse(await fetch('/api/artwall', { headers: authHeaders() }))
}
export async function createArtwall(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/artwall', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchArtwall(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/artwall/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postArtwall(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runArtwallSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postArtwall('/api/artwall/sweep', body)
}
export async function ackArtwallFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postArtwall('/api/artwall/flag/ack', body)
}
export async function markArtwallExhibitStale(body: Record<string, unknown> = {}): Promise<any> {
  return postArtwall('/api/artwall/stale', body)
}
export async function rotateArtwallPiece(body: Record<string, unknown> = {}): Promise<any> {
  return postArtwall('/api/artwall/rotate', body)
}
export async function seedGalleryNight(body: Record<string, unknown> = {}): Promise<any> {
  return postArtwall('/api/artwall/gallery-night/seed', body)
}
