import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchDive(): Promise<any> {
  return parse(await fetch('/api/dive', { headers: authHeaders() }))
}
export async function createDive(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/dive', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchDive(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/dive/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runDiveSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/dive/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackDiveFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/dive/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markDiveCertExpired(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/dive/cert/expired', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function checkInDive(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/dive/checkin', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedBoatTrip(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/dive/boat/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
