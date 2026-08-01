import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCrucible2() { return parse(await fetch('/api/crucible2', { headers: authHeaders() })) }
export async function runCrucible2Sweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/crucible2/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveCrucible2Pilot(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/crucible2/pilot/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function busyCrucible2Learn(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/crucible2/learn/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function shipCrucible2Lab(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/crucible2/lab/ship', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackCrucible2Flag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/crucible2/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
