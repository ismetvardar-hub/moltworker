import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchEmpire() { return parse(await fetch('/api/empire', { headers: authHeaders() })) }
export async function runEmpireSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/empire/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function syncEmpireTy(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/empire/ty/sync', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function shipEmpireHepha(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/empire/hepha/ship', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function departEmpireTour(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/empire/tour/depart', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackEmpireFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/empire/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

