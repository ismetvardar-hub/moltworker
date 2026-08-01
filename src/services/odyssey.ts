import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchOdyssey() { return parse(await fetch('/api/odyssey', { headers: authHeaders() })) }
export async function runOdysseySweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/odyssey/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function recoverOdysseyOkr(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/odyssey/okr/recover', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function coolOdysseyRisk(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/odyssey/risk/cool', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function hitOdysseyStar(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/odyssey/star/hit', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackOdysseyFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/odyssey/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

