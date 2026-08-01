import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchNightly() {
  return parse(await fetch('/api/nightly', { headers: authHeaders() }))
}
export async function runNightlySweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/nightly/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function closeNightlyLog(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/nightly/log/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function closeNightlyFolio(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/nightly/folio/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function approveNightlyLate(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/nightly/late/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function ackNightlyFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/nightly/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

