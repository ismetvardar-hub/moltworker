import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchSustain(): Promise<any> {
  return parse(await fetch('/api/sustain', { headers: authHeaders() }))
}
export async function createSustain(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/sustain', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}

export async function patchSustain(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/sustain/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postSustain(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runSustainSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postSustain('/api/sustain/sweep', body)
}
export async function ackSustainFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postSustain('/api/sustain/flag/ack', body)
}
export async function markSustainKpiMiss(body: Record<string, unknown> = {}): Promise<any> {
  return postSustain('/api/sustain/kpi/miss', body)
}
export async function logSustainAction(body: Record<string, unknown> = {}): Promise<any> {
  return postSustain('/api/sustain/action/log', body)
}
export async function seedGreenWeek(body: Record<string, unknown> = {}): Promise<any> {
  return postSustain('/api/sustain/green-week/seed', body)
}

