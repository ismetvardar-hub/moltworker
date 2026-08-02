import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchKds(): Promise<any> {
  return parse(await fetch('/api/kds', { headers: authHeaders() }))
}
export async function createKds(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/kds', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(input) }))
}
export async function patchKds(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/kds/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) }))
}

export async function runKdsSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/kds/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackKdsFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/kds/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ageKdsTicket(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/kds/ticket/age', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function bumpKdsTicket(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/kds/ticket/bump', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedRushKdsTicket(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/kds/rush/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
