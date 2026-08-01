import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchAegis() {
  return parse(await fetch('/api/aegis', { headers: authHeaders() }))
}
export async function runAegisSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/aegis/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function ackAegisFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/aegis/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function clearAegisSafety(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/aegis/safety/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function closeAegisIncident(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/aegis/incident/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function clearAegisEvac(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/aegis/evac/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
