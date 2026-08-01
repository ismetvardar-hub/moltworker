import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchSentinel() { return parse(await fetch('/api/sentinel', { headers: authHeaders() })) }
export async function runSentinelSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/sentinel/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function resolveSentinelLost(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/sentinel/lost/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function serviceSentinelAed(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/sentinel/aed/service', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function flowSentinelGate(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/sentinel/gate/flow', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackSentinelFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/sentinel/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

