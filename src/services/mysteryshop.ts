import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchMysteryshop(): Promise<any> {
  return parse(await fetch('/api/mysteryshop', { headers: authHeaders() }))
}
export async function createMysteryshop(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/mysteryshop', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchMysteryshop(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/mysteryshop/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postMysteryshop(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runMysteryshopSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postMysteryshop('/api/mysteryshop/sweep', body)
}
export async function ackMysteryshopFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postMysteryshop('/api/mysteryshop/flag/ack', body)
}
export async function markMysteryshopLowScoreVisit(body: Record<string, unknown> = {}): Promise<any> {
  return postMysteryshop('/api/mysteryshop/low-score', body)
}
export async function assignMysteryshopCoach(body: Record<string, unknown> = {}): Promise<any> {
  return postMysteryshop('/api/mysteryshop/coach/assign', body)
}
export async function seedMysteryshopFollowUp(body: Record<string, unknown> = {}): Promise<any> {
  return postMysteryshop('/api/mysteryshop/follow-up/seed', body)
}
