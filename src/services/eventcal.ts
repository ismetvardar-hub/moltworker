import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchEventcal(): Promise<any> {
  return parse(await fetch('/api/eventcal', { headers: authHeaders() }))
}
export async function createEventcal(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/eventcal', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(input) }))
}
export async function patchEventcal(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/eventcal/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) }))
}

export async function runEventcalSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/eventcal/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackEventcalFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/eventcal/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function flagEventcalConflict(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/eventcal/conflict', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function publishEventcalEvent(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/eventcal/publish', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedHoldingEventcalEvent(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/eventcal/holding/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
