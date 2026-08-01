import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchSkyline() { return parse(await fetch('/api/skyline', { headers: authHeaders() })) }
export async function runSkylineSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/skyline/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function passSkylineSound(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/skyline/sound/pass', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function endSkylineEscape(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/skyline/escape/end', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function serviceSkylineJet(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/skyline/jet/service', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackSkylineFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/skyline/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

