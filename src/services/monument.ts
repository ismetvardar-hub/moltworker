import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchMonument() { return parse(await fetch('/api/monument', { headers: authHeaders() })) }
export async function runMonumentSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/monument/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeMonumentCorrective(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/monument/corrective/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveMonumentOral(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/monument/oral/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function runMonumentTimeline(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/monument/timeline/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackMonumentFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/monument/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
