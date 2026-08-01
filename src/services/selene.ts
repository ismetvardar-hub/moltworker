import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchSelene() { return parse(await fetch('/api/selene', { headers: authHeaders() })) }
export async function runSeleneSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/selene/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeSeleneHeat(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/selene/heat/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveSeleneSupplier(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/selene/supplier/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function runSeleneBoard(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/selene/board/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackSeleneFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/selene/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
