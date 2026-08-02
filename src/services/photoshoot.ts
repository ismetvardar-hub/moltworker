import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPhotoshoot(): Promise<any> {
  return parse(await fetch('/api/photoshoot', { headers: authHeaders() }))
}
export async function createPhotoshoot(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/photoshoot', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchPhotoshoot(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/photoshoot/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postPhotoshoot(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runPhotoshootSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postPhotoshoot('/api/photoshoot/sweep', body)
}
export async function ackPhotoshootFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postPhotoshoot('/api/photoshoot/flag/ack', body)
}
export async function markPhotoshootPermitPending(body: Record<string, unknown> = {}): Promise<any> {
  return postPhotoshoot('/api/photoshoot/permit/pending', body)
}
export async function approvePhotoshootSlot(body: Record<string, unknown> = {}): Promise<any> {
  return postPhotoshoot('/api/photoshoot/slot/approve', body)
}
export async function seedBrandShoot(body: Record<string, unknown> = {}): Promise<any> {
  return postPhotoshoot('/api/photoshoot/brand-shoot/seed', body)
}
