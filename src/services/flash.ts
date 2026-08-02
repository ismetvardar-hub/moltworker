import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchFlash(): Promise<any> {
  return parse(await fetch('/api/flash', { headers: authHeaders() }))
}
export async function createFlash(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/flash', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchFlash(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/flash/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postFlash(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runFlashSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postFlash('/api/flash/sweep', body)
}
export async function ackFlashFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postFlash('/api/flash/flag/ack', body)
}
export async function markFlashStaleDeal(body: Record<string, unknown> = {}): Promise<any> {
  return postFlash('/api/flash/deal/stale', body)
}
export async function publishFlash(body: Record<string, unknown> = {}): Promise<any> {
  return postFlash('/api/flash/publish', body)
}
export async function seedMidnightSale(body: Record<string, unknown> = {}): Promise<any> {
  return postFlash('/api/flash/midnight-sale/seed', body)
}
