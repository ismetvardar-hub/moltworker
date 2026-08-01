import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchElysium() { return parse(await fetch('/api/elysium', { headers: authHeaders() })) }
export async function runElysiumSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/elysium/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function closeElysiumAccess(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/elysium/access/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function approveElysiumRole(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/elysium/role/approve', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function archiveElysiumBreach(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/elysium/breach/archive', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackElysiumFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/elysium/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

