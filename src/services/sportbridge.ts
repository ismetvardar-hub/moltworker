import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchSportBridge() {
  return parse(await fetch('/api/sportbridge', { headers: authHeaders() }))
}
export async function linkSportProfiles(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sportbridge/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function syncSlotToSession(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sportbridge/sync-slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function bridgeRecoveryPlan(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sportbridge/recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function runSportEligibilitySweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sportbridge/eligibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
