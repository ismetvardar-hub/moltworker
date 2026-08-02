import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchDigest() {
  return parse(await fetch('/api/digest', { headers: authHeaders() }))
}
export async function runDigestSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/digest/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function refreshDigestReadiness(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/digest/readiness/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function escalateDigestGap(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/digest/gap/escalate', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function resolveDigestGap(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/digest/gap/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackDigestFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/digest/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
