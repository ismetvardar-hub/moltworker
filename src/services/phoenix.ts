import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPhoenix() { return parse(await fetch('/api/phoenix', { headers: authHeaders() })) }
export async function runPhoenixSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/phoenix/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closePhoenixBackup(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/phoenix/backup/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function livePhoenixRunbook(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/phoenix/runbook/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closePhoenixDrill(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/phoenix/drill/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackPhoenixFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/phoenix/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
