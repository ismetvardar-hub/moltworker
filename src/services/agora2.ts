import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchAgora2() { return parse(await fetch('/api/agora2', { headers: authHeaders() })) }
export async function runAgora2Sweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/agora2/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function runAgora2Drill(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/agora2/drill/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function busyAgora2Circle(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/agora2/circle/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveAgora2Badge(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/agora2/badge/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackAgora2Flag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/agora2/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
