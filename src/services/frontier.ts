import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchFrontier() { return parse(await fetch('/api/frontier', { headers: authHeaders() })) }
export async function runFrontierSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/frontier/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function runFrontierRestore(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/frontier/restore/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function busyFrontierSite(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/frontier/site/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveFrontierHire(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/frontier/hire/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackFrontierFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/frontier/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
