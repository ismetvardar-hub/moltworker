import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchAlliance2() { return parse(await fetch('/api/alliance2', { headers: authHeaders() })) }
export async function runAlliance2Sweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/alliance2/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function busyAlliance2Partner(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/alliance2/partner/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeAlliance2Channel(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/alliance2/channel/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveAlliance2Invest(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/alliance2/invest/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackAlliance2Flag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/alliance2/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
