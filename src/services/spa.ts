import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchSpa(): Promise<any> {
  return parse(await fetch('/api/spa', { headers: authHeaders() }))
}
export async function createSpa(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/spa', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(input) }))
}
export async function patchSpa(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/spa/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) }))
}

export async function runSpaSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/spa/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackSpaFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/spa/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function markSpaAppointmentOverrun(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/spa/appointment/overrun', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function completeSpaTreatment(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/spa/treatment/complete', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function seedCouplesPackage(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/spa/couples/seed', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
