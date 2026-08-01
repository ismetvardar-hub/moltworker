import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchVerdant() {
  return parse(await fetch('/api/verdant', { headers: authHeaders() }))
}
export async function runVerdantSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/verdant/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function clearVerdantWater(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/verdant/water/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function closeVerdantEsg(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/verdant/esg/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function fixVerdantEv(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/verdant/ev/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function ackVerdantFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/verdant/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

