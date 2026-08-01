import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchBastion2() { return parse(await fetch('/api/bastion2', { headers: authHeaders() })) }
export async function runBastion2Sweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/bastion2/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeBastion2Access(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/bastion2/access/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function approveBastion2Role(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/bastion2/role/approve', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function archiveBastion2Breach(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/bastion2/breach/archive', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackBastion2Flag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/bastion2/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
