import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchHelios() { return parse(await fetch('/api/helios', { headers: authHeaders() })) }
export async function runHeliosSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/helios/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function runHeliosInbound(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/helios/inbound/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function busyHeliosAsn(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/helios/asn/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveHeliosSlot(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/helios/slot/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackHeliosFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/helios/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
