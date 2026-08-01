import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchKeystone() { return parse(await fetch('/api/keystone', { headers: authHeaders() })) }
export async function runKeystoneSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/keystone/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function clearKeystoneBus(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/keystone/bus/clear', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function healKeystoneSlo(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/keystone/slo/heal', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeKeystoneEsc(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/keystone/esc/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackKeystoneFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/keystone/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
