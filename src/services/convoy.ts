import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchConvoy() { return parse(await fetch('/api/convoy', { headers: authHeaders() })) }
export async function runConvoySweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/convoy/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function clearConvoyDispatch(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/convoy/dispatch/clear', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function readyConvoyFleet(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/convoy/fleet/ready', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function freeConvoyCurb(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/convoy/curb/free', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackConvoyFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/convoy/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
