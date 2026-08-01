import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchGaia() { return parse(await fetch('/api/gaia', { headers: authHeaders() })) }
export async function runGaiaSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/gaia/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeGaiaLegacy(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/gaia/legacy/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveGaiaQuiet(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/gaia/quiet/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function runGaiaPillow(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/gaia/pillow/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackGaiaFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/gaia/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
