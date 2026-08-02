import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchNightlog(): Promise<any> {
  return parse(await fetch('/api/nightlog', { headers: authHeaders() }))
}
export async function createNightlog(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/nightlog', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchNightlog(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/nightlog/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postNightlog(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runNightlogSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postNightlog('/api/nightlog/sweep', body)
}
export async function ackNightlogFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postNightlog('/api/nightlog/flag/ack', body)
}
export async function ageNightlogOpenIncident(body: Record<string, unknown> = {}): Promise<any> {
  return postNightlog('/api/nightlog/incident/age', body)
}
export async function closeNightlogEntry(body: Record<string, unknown> = {}): Promise<any> {
  return postNightlog('/api/nightlog/entry/close', body)
}
export async function seedNightlogSecurityNote(body: Record<string, unknown> = {}): Promise<any> {
  return postNightlog('/api/nightlog/security-note/seed', body)
}
