import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPatrol(): Promise<any> {
  return parse(await fetch('/api/patrol', { headers: authHeaders() }))
}
export async function createPatrol(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/patrol', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchPatrol(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/patrol/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runPatrolSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/patrol/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackPatrolFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/patrol/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markPatrolMissedCheckpoint(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/patrol/checkpoint/missed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function completePatrolRound(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/patrol/round/complete', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedNightRoute(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/patrol/night-route/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
