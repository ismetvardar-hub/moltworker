import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchSerenity2() { return parse(await fetch('/api/serenity2', { headers: authHeaders() })) }
export async function runSerenity2Sweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/serenity2/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeSerenity2Legacy(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/serenity2/legacy/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveSerenity2Quiet(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/serenity2/quiet/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function runSerenity2Pillow(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/serenity2/pillow/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackSerenity2Flag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/serenity2/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
