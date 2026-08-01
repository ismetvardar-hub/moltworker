import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchKairos() { return parse(await fetch('/api/kairos', { headers: authHeaders() })) }
export async function runKairosSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/kairos/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function runKairosDrill(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/kairos/drill/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function busyKairosCircle(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/kairos/circle/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveKairosBadge(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/kairos/badge/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackKairosFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/kairos/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
