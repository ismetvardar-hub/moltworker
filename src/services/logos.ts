import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchLogos() { return parse(await fetch('/api/logos', { headers: authHeaders() })) }
export async function runLogosSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/logos/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveLogosPilot(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/logos/pilot/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function busyLogosLearn(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/logos/learn/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function shipLogosLab(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/logos/lab/ship', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackLogosFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/logos/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
