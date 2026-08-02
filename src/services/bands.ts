import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchBands(): Promise<any> {
  return parse(await fetch('/api/bands', { headers: authHeaders() }))
}
export async function createBands(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/bands', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchBands(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/bands/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postBands(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runBandsSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postBands('/api/bands/sweep', body)
}
export async function ackBandsFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postBands('/api/bands/flag/ack', body)
}
export async function markBandsWristbandMismatch(body: Record<string, unknown> = {}): Promise<any> {
  return postBands('/api/bands/wristband/mismatch', body)
}
export async function reissueBand(body: Record<string, unknown> = {}): Promise<any> {
  return postBands('/api/bands/reissue', body)
}
export async function seedDayPassBand(body: Record<string, unknown> = {}): Promise<any> {
  return postBands('/api/bands/day-pass/seed', body)
}
