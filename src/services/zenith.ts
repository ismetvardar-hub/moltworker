import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchZenith() { return parse(await fetch('/api/zenith', { headers: authHeaders() })) }
export async function runZenithSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/zenith/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function catchZenithPace(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/zenith/pace/catch', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function healZenithMargin(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/zenith/margin/heal', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function coolZenithDemand(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/zenith/demand/cool', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackZenithFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/zenith/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
