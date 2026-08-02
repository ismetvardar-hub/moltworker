import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchHammam(): Promise<any> {
  return parse(await fetch('/api/hammam', { headers: authHeaders() }))
}
export async function createHammam(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/hammam', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchHammam(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/hammam/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runHammamSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/hammam/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackHammamFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/hammam/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markHammamSlotOverrun(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/hammam/slot/overrun', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function completeHammamSession(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/hammam/session/complete', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedCouplesRitual(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/hammam/couples/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
