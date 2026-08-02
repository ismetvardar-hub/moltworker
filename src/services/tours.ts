import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchTours(): Promise<any> {
  return parse(await fetch('/api/tours', { headers: authHeaders() }))
}
export async function createTours(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/tours', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchTours(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/tours/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runToursSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/tours/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackToursFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/tours/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markTourDepartureSoon(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/tours/departure/soon', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function checkInTourGuest(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/tours/checkin', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedSunsetTour(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/tours/sunset/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
