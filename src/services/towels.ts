import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchTowels(): Promise<any> {
  return parse(await fetch('/api/towels', { headers: authHeaders() }))
}
export async function createTowels(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/towels', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchTowels(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/towels/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runTowelsSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/towels/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackTowelsFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/towels/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markTowelsShortageZone(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/towels/shortage', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function restockTowels(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/towels/restock', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedPoolRush(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/towels/pool-rush/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
