import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCharter2() { return parse(await fetch('/api/charter2', { headers: authHeaders() })) }
export async function runCharter2Sweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/charter2/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function closeCharter2Ethics(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/charter2/ethics/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function liveCharter2Risk(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/charter2/risk/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function doneCharter2Claim(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/charter2/claim/done', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackCharter2Flag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/charter2/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

