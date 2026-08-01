import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchAlliance3() { return parse(await fetch('/api/alliance3', { headers: authHeaders() })) }
export async function runAlliance3Sweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/alliance3/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function busyAlliance3Partner(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/alliance3/partner/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeAlliance3Channel(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/alliance3/channel/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveAlliance3Invest(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/alliance3/invest/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackAlliance3Flag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/alliance3/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
