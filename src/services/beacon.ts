import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchBeacon() { return parse(await fetch('/api/beacon', { headers: authHeaders() })) }
export async function runBeaconSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/beacon/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function liveBeaconCamp(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/beacon/camp/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function fixBeaconSocial(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/beacon/social/fix', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function healBeaconSeo(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/beacon/seo/heal', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackBeaconFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/beacon/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
