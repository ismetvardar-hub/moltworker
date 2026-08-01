import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCrucible() { return parse(await fetch('/api/crucible', { headers: authHeaders() })) }
export async function runCrucibleSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/crucible/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveCruciblePilot(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/crucible/pilot/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function busyCrucibleLearn(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/crucible/learn/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function shipCrucibleLab(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/crucible/lab/ship', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackCrucibleFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/crucible/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
