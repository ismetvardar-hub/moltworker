import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchOlympus() { return parse(await fetch('/api/olympus', { headers: authHeaders() })) }
export async function runOlympusSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/olympus/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeOlympusSeal(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/olympus/seal/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function liveOlympusBrief(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/olympus/brief/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function busyOlympusStory(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/olympus/story/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackOlympusFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/olympus/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
