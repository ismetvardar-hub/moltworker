import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCognisphere() {
  return parse(await fetch('/api/cognisphere', { headers: authHeaders() }))
}
export async function runCognisphereSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/cognisphere/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function ackCognisphereFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/cognisphere/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function haltCognisphereCost(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/cognisphere/cost/halt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function clearCognisphereDrift(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/cognisphere/drift/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function mitigateCognisphereRisk(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/cognisphere/mitigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
