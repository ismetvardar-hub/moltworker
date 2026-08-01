import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPathos() { return parse(await fetch('/api/pathos', { headers: authHeaders() })) }
export async function runPathosSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/pathos/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closePathosIp(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/pathos/ip/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function livePathosRisk(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/pathos/risk/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function runPathosClaim(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/pathos/claim/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackPathosFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/pathos/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
