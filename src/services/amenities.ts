import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchAmenities(): Promise<any> {
  return parse(await fetch('/api/amenities', { headers: authHeaders() }))
}
export async function createAmenities(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/amenities', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchAmenities(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/amenities/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runAmenitiesSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/amenities/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackAmenitiesFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/amenities/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markAmenitiesRequestBacklog(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/amenities/request/backlog', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function fulfillAmenitiesRequest(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/amenities/fulfill', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedPillowMenu(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/amenities/pillow-menu/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
