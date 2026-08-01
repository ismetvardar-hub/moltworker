import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchArtery() { return parse(await fetch('/api/artery', { headers: authHeaders() })) }
export async function runArterySweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/artery/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function runArteryInbound(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/artery/inbound/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function busyArteryAsn(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/artery/asn/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeArteryDock(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/artery/dock/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackArteryFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/artery/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
