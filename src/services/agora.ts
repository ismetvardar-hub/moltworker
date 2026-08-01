import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchAgora() { return parse(await fetch('/api/agora', { headers: authHeaders() })) }
export async function runAgoraSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/agora/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function runAgoraDrill(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/agora/drill/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function busyAgoraCircle(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/agora/circle/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function liveAgoraBadge(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/agora/badge/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackAgoraFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/agora/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
