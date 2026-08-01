import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPhoenix2() { return parse(await fetch('/api/phoenix2', { headers: authHeaders() })) }
export async function runPhoenix2Sweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/phoenix2/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function closePhoenix2Backup(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/phoenix2/backup/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function livePhoenix2Runbook(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/phoenix2/runbook/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function closePhoenix2Drill(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/phoenix2/drill/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackPhoenix2Flag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/phoenix2/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

