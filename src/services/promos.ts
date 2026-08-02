import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPromos(): Promise<any> {
  return parse(await fetch('/api/promos', { headers: authHeaders() }))
}
export async function createPromos(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/promos', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchPromos(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/promos/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postPromos(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runPromosSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postPromos('/api/promos/sweep', body)
}
export async function ackPromosFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postPromos('/api/promos/flag/ack', body)
}
export async function markPromoExpiredLiveCode(body: Record<string, unknown> = {}): Promise<any> {
  return postPromos('/api/promos/expired-live', body)
}
export async function pausePromo(body: Record<string, unknown> = {}): Promise<any> {
  return postPromos('/api/promos/pause', body)
}
export async function seedFlashPromo(body: Record<string, unknown> = {}): Promise<any> {
  return postPromos('/api/promos/flash/seed', body)
}
