import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchArtery2() { return parse(await fetch('/api/artery2', { headers: authHeaders() })) }
export async function runArtery2Sweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/artery2/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function runArtery2Inbound(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/artery2/inbound/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function busyArtery2Asn(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/artery2/asn/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeArtery2Dock(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/artery2/dock/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackArtery2Flag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/artery2/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
