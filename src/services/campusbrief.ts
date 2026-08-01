import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCampusBrief() {
  return parse(await fetch('/api/campusbrief', { headers: authHeaders() }))
}
export async function runCampusAutomations() {
  return parse(
    await fetch('/api/campusbrief/auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: '{}',
    }),
  )
}

export async function syncCampusBriefActions() {
  return parse(
    await fetch('/api/campusbrief/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: '{}',
    }),
  )
}

export async function ackCampusBriefAction(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campusbrief/actions/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function assignCampusBriefAction(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campusbrief/actions/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function escalateCampusBriefAction(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campusbrief/actions/escalate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function snoozeCampusBriefAction(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campusbrief/actions/snooze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function wakeSnoozedCampusBriefActions(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campusbrief/actions/wake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function dismissCampusBriefAction(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campusbrief/actions/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function publishCampusBriefDigest() {
  return parse(
    await fetch('/api/campusbrief/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: '{}',
    }),
  )
}
