import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchEcosphere() {
  return parse(await fetch('/api/ecosphere', { headers: authHeaders() }))
}
export async function runEcosphereSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/ecosphere/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function ackEcosphereFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/ecosphere/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function mitigateEcosphereFinding(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/ecosphere/finding/mitigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function fulfillEcosphereDataprotect(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/ecosphere/dataprotect/fulfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function clearEcosphereVendorHigh(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/ecosphere/vendor/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
