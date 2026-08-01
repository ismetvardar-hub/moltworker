import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPyramid() { return parse(await fetch('/api/pyramid', { headers: authHeaders() })) }
export async function runPyramidSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/pyramid/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function resolvePyramidSys(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/pyramid/sys/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function healPyramidNet(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/pyramid/net/heal', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function flushPyramidComms(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/pyramid/comms/flush', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackPyramidFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/pyramid/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
