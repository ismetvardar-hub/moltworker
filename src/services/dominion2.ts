import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchDominion2() { return parse(await fetch('/api/dominion2', { headers: authHeaders() })) }
export async function runDominion2Sweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/dominion2/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveDominion2Supplier(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/dominion2/supplier/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function runDominion2Board(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/dominion2/board/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function busyDominion2Cash(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/dominion2/cash/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackDominion2Flag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/dominion2/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
