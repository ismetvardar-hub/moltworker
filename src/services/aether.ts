import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchAether() {
  return parse(await fetch('/api/aether', { headers: authHeaders() }))
}
export async function runAetherSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/aether/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function activateAetherPartner(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/aether/partner/activate', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function closeAetherDeal(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/aether/deal/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function liveAetherCoinvest(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/aether/coinvest/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackAetherFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/aether/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

