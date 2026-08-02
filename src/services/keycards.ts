import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchKeycards(): Promise<any> {
  return parse(await fetch('/api/keycards', { headers: authHeaders() }))
}
export async function createKeycards(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/keycards', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchKeycards(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/keycards/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runKeycardsSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/keycards/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackKeycardsFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/keycards/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function expireKeycardAccess(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/keycards/access/expire', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function reissueKeycard(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/keycards/reissue', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedLostKeycard(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/keycards/lost/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
