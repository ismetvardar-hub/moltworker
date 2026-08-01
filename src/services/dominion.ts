import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchDominion() { return parse(await fetch('/api/dominion', { headers: authHeaders() })) }
export async function runDominionSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/dominion/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveDominionSupplier(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/dominion/supplier/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function runDominionBoard(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/dominion/board/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function busyDominionCash(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/dominion/cash/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackDominionFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/dominion/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
