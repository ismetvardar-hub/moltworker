import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchOrbit() {
  return parse(await fetch('/api/orbit', { headers: authHeaders() }))
}
export async function runOrbitSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/orbit/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function cleanOrbitRooms(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/orbit/room/clean', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function encodeOrbitKeys(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/orbit/key/encode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function retryOrbitGuestapp(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/orbit/guestapp/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function ackOrbitFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/orbit/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

