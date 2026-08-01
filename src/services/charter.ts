import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCharter() { return parse(await fetch('/api/charter', { headers: authHeaders() })) }
export async function runCharterSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/charter/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeCharterEthics(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/charter/ethics/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveCharterRisk(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/charter/risk/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function doneCharterClaim(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/charter/claim/done', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackCharterFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/charter/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
