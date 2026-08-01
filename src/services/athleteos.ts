import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchAthleteOs() {
  return parse(await fetch('/api/athleteos', { headers: authHeaders() }))
}

export async function upsertAthletePlan(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/athleteos/plan', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function logAthleteSession(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/athleteos/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function issueAthleteLicense(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/athleteos/license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function fetchAthleteReadiness() {
  return parse(await fetch('/api/athleteos/readiness', { headers: authHeaders() }))
}


export async function setAthleteClearance(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/athleteos/clearance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function reportAthleteInjury(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/athleteos/injury', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function advanceReturnToPlay(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/athleteos/return-to-play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function runAthleteRtpSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/athleteos/rtp-sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function registerAthleteCompetition(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/athleteos/competition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function clearAthleteForCompetition(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/athleteos/competition/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function runAthleteCompetitionClearanceSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/athleteos/competition/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function assignAthleteCoach(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/athleteos/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function placeAthleteMedicalHold(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/athleteos/medical-hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function clearAthleteMedicalHold(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/athleteos/medical-hold/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
