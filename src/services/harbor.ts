import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchHarbor() { return parse(await fetch('/api/harbor', { headers: authHeaders() })) }
export async function runHarborSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/harbor/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function clearHarborCold(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/harbor/cold/clear', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function releaseHarborHold(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/harbor/hold/release', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function invoiceHarborDemurrage(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/harbor/demurrage/invoice', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackHarborFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/harbor/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

