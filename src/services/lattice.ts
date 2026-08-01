import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchLattice() { return parse(await fetch('/api/lattice', { headers: authHeaders() })) }
export async function runLatticeSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/lattice/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function healLatticeGate(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/lattice/gate/heal', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function retryLatticeOta(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/lattice/ota/retry', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function clearLatticeFailback(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/lattice/failback/clear', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackLatticeFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/lattice/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
