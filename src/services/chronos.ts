import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchChronos() { return parse(await fetch('/api/chronos', { headers: authHeaders() })) }
export async function runChronosSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/chronos/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function busyChronosMoment(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/chronos/moment/busy', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function closeChronosHook(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/chronos/hook/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function liveChronosSchema(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/chronos/schema/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackChronosFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/chronos/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
