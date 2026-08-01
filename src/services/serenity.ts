import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchSerenity() { return parse(await fetch('/api/serenity', { headers: authHeaders() })) }
export async function runSerenitySweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/serenity/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeSerenityLegacy(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/serenity/legacy/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveSerenityQuiet(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/serenity/quiet/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function runSerenityPillow(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/serenity/pillow/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackSerenityFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/serenity/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
