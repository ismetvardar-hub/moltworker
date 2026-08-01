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

export async function gateSportSlotAccess(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sportbridge/gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function applySportCompetitionHold(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sportbridge/comp-hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function completeBridgeRecovery(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sportbridge/recovery/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function runSportPostCompSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sportbridge/postcomp-sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function snoozeSportHold(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sportbridge/hold/snooze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function wakeSportHolds(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sportbridge/hold/wake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function escalateSportGate(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sportbridge/gate/escalate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function archiveSportBridgeLink(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sportbridge/link/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
