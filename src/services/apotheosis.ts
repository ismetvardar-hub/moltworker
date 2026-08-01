import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchApotheosis() { return parse(await fetch('/api/apotheosis', { headers: authHeaders() })) }
export async function runApotheosisSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/apotheosis/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeApotheosisBackup(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/apotheosis/backup/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveApotheosisRunbook(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/apotheosis/runbook/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeApotheosisDrill(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/apotheosis/drill/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackApotheosisFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/apotheosis/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
