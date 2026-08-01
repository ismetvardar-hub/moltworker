import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchSanctum() {
  return parse(await fetch('/api/sanctum', { headers: authHeaders() }))
}
export async function runSanctumSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sanctum/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function clearSanctumSpa(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sanctum/spa/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function clearSanctumBio(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sanctum/bio/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function completeSanctumSession(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sanctum/session/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function ackSanctumFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/sanctum/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

