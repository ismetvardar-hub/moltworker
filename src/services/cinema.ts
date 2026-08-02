import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCinema(): Promise<any> {
  return parse(await fetch('/api/cinema', { headers: authHeaders() }))
}
export async function createCinema(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/cinema', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchCinema(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/cinema/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postCinema(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runCinemaSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postCinema('/api/cinema/sweep', body)
}
export async function ackCinemaFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postCinema('/api/cinema/flag/ack', body)
}
export async function markCinemaShowtimeConflict(body: Record<string, unknown> = {}): Promise<any> {
  return postCinema('/api/cinema/showtime/conflict', body)
}
export async function seatCinemaHouse(body: Record<string, unknown> = {}): Promise<any> {
  return postCinema('/api/cinema/seat-house', body)
}
export async function seedPremiere(body: Record<string, unknown> = {}): Promise<any> {
  return postCinema('/api/cinema/premiere/seed', body)
}
