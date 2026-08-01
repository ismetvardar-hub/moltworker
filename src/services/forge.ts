import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchForge() {
  return parse(await fetch('/api/forge', { headers: authHeaders() }))
}
export async function runForgeSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/forge/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function ackForgeFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/forge/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function advanceForgeTalent(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/forge/talent/advance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function renewForgeCert(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/forge/cert/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function approveForgeShift(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/forge/shift/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
