import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchMirror() { return parse(await fetch('/api/mirror', { headers: authHeaders() })) }
export async function runMirrorSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/mirror/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function refreshMirrorTwin(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/mirror/twin/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function acceptMirrorNba(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/mirror/nba/accept', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeMirrorRecovery(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/mirror/recovery/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackMirrorFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/mirror/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
