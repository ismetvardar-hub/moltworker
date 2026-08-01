import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCitadel() {
  return parse(await fetch('/api/citadel', { headers: authHeaders() }))
}
export async function runCitadelSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/citadel/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function clearCitadelPlant(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/citadel/plant/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function clearCitadelHvac(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/citadel/hvac/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function closeCitadelWorkorder(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/citadel/workorder/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function ackCitadelFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/citadel/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

