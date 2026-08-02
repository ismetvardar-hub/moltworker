import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchDawnservice(): Promise<any> {
  return parse(await fetch('/api/dawnservice', { headers: authHeaders() }))
}
export async function createDawnservice(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/dawnservice', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchDawnservice(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/dawnservice/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postDawnservice(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runDawnserviceSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postDawnservice('/api/dawnservice/sweep', body)
}
export async function ackDawnserviceFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postDawnservice('/api/dawnservice/flag/ack', body)
}
export async function markDawnserviceMissedTray(body: Record<string, unknown> = {}): Promise<any> {
  return postDawnservice('/api/dawnservice/tray/missed', body)
}
export async function completeDawnserviceRound(body: Record<string, unknown> = {}): Promise<any> {
  return postDawnservice('/api/dawnservice/round/complete', body)
}
export async function seedSunriseAmenity(body: Record<string, unknown> = {}): Promise<any> {
  return postDawnservice('/api/dawnservice/sunrise-amenity/seed', body)
}
