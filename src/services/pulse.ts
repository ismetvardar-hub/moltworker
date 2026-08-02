import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPulse(): Promise<any> {
  return parse(await fetch('/api/pulse', { headers: authHeaders() }))
}
export async function createPulse(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/pulse', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(input) }))
}
export async function patchPulse(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/pulse/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) }))
}

export async function runPulseSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/pulse/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackPulseFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/pulse/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function markPulseStaleSignal(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/pulse/signal/stale', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function refreshPulseChannel(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/pulse/channel/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function seedCampusBeat(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/pulse/campus-beat/seed', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
