import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchTide() { return parse(await fetch('/api/tide', { headers: authHeaders() })) }
export async function runTideSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/tide/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function clearTideReef(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/tide/reef/clear', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function openTideCliff(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/tide/cliff/open', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function freeTidePier(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/tide/pier/free', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackTideFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/tide/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

