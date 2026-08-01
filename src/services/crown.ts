import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCrown() { return parse(await fetch('/api/crown', { headers: authHeaders() })) }
export async function runCrownSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/crown/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function houseCrownVip(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/crown/vip/house', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeCrownCase(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/crown/case/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveCrownWinback(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/crown/winback/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackCrownFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/crown/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
