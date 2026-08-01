import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchHearth() {
  return parse(await fetch('/api/hearth', { headers: authHeaders() }))
}
export async function runHearthSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/hearth/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function runHearthPass(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/hearth/pass/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function clearHearthAllergen(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/hearth/allergen/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function sendHearthPlate(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/hearth/plate/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function ackHearthFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/hearth/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

