import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCircuit2() { return parse(await fetch('/api/circuit2', { headers: authHeaders() })) }
export async function runCircuit2Sweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/circuit2/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function busyCircuit2Moment(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/circuit2/moment/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeCircuit2Hook(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/circuit2/hook/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveCircuit2Schema(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/circuit2/schema/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackCircuit2Flag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/circuit2/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
