import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPeoplehub() {
  return parse(await fetch('/api/peoplehub', { headers: authHeaders() }))
}
export async function runPeoplehubSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/peoplehub/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function approvePeoplehubLeave(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/peoplehub/leave/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function closePeoplehubNearmiss(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/peoplehub/nearmiss/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function completePeoplehubOnboarding(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/peoplehub/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function ackPeoplehubFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/peoplehub/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

