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

