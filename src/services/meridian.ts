import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchMeridian() {
  return parse(await fetch('/api/meridian', { headers: authHeaders() }))
}
export async function runMeridianSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/meridian/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function approveMeridianMove(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/meridian/move/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function approveMeridianEarly(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/meridian/early/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function clearMeridianTurndown(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/meridian/turndown/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function ackMeridianFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/meridian/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

