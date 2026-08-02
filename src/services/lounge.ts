import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchLounge(): Promise<any> {
  return parse(await fetch('/api/lounge', { headers: authHeaders() }))
}
export async function createLounge(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/lounge', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchLounge(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/lounge/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postLounge(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runLoungeSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postLounge('/api/lounge/sweep', body)
}
export async function ackLoungeFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postLounge('/api/lounge/flag/ack', body)
}
export async function markLoungeCapacityBreach(body: Record<string, unknown> = {}): Promise<any> {
  return postLounge('/api/lounge/capacity/breach', body)
}
export async function seatLoungeGuest(body: Record<string, unknown> = {}): Promise<any> {
  return postLounge('/api/lounge/guest/seat', body)
}
export async function seedAfternoonTea(body: Record<string, unknown> = {}): Promise<any> {
  return postLounge('/api/lounge/afternoon-tea/seed', body)
}
