import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchBikerent(): Promise<any> {
  return parse(await fetch('/api/bikerent', { headers: authHeaders() }))
}
export async function createBikerent(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/bikerent', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchBikerent(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/bikerent/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postBikerent(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runBikerentSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postBikerent('/api/bikerent/sweep', body)
}
export async function ackBikerentFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postBikerent('/api/bikerent/flag/ack', body)
}
export async function markBikerentOverdueReturn(body: Record<string, unknown> = {}): Promise<any> {
  return postBikerent('/api/bikerent/overdue-return', body)
}
export async function checkInBikerentBike(body: Record<string, unknown> = {}): Promise<any> {
  return postBikerent('/api/bikerent/checkin', body)
}
export async function seedCoastalRide(body: Record<string, unknown> = {}): Promise<any> {
  return postBikerent('/api/bikerent/coastal-ride/seed', body)
}
