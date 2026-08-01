import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchHorizon() {
  return parse(await fetch('/api/horizon', { headers: authHeaders() }))
}
export async function runHorizonSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/horizon/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function clearHorizonAllergy(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/horizon/allergy/clear', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function closeHorizonTabs(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/horizon/tab/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function approveHorizonComps(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/horizon/comp/approve', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackHorizonFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/horizon/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

