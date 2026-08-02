import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchEmergency(): Promise<any> {
  return parse(await fetch('/api/emergency', { headers: authHeaders() }))
}
export async function createEmergency(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/emergency', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(input) }))
}
export async function patchEmergency(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/emergency/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) }))
}

export async function runEmergencySweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/emergency/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackEmergencyFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/emergency/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function acknowledgeEmergencyIncident(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/emergency/incident/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function closeEmergencyIncident(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/emergency/incident/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function seedEmergencyDrill(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/emergency/drill/seed', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
