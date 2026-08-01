import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchSignalhub() { return parse(await fetch('/api/signalhub', { headers: authHeaders() })) }
export async function runSignalhubSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/signalhub/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function clearSignalhubWater(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/signalhub/water/clear', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function clearSignalhubChem(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/signalhub/chem/clear', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function clearSignalhubGate(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/signalhub/gate/clear', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackSignalhubFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/signalhub/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

