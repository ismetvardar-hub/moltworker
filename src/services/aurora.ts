import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchAurora() {
  return parse(await fetch('/api/aurora', { headers: authHeaders() }))
}
export async function runAuroraSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/aurora/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function clearAuroraFlow(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/aurora/flow/clear', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function endAuroraLight(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/aurora/light/end', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function dayAuroraNightmode(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/aurora/night/day', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackAuroraFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/aurora/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

