import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

async function post(path: string, body: Record<string, unknown> = {}) {
  return parse(
    await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function fetchHours(): Promise<any> {
  return parse(await fetch('/api/hours', { headers: authHeaders() }))
}

export async function patchHours(venueId: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/hours/${encodeURIComponent(venueId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch),
  }))
}

export async function runHoursSweep(body: Record<string, unknown> = {}) {
  return post('/api/hours/sweep', body)
}

export async function ackHoursFlag(body: Record<string, unknown> = {}) {
  return post('/api/hours/flag/ack', body)
}

export async function openVenueHours(body: Record<string, unknown> = {}) {
  return post('/api/hours/open', body)
}

export async function closeVenueHours(body: Record<string, unknown> = {}) {
  return post('/api/hours/close', body)
}

export async function applyHolidayNote(body: Record<string, unknown> = {}) {
  return post('/api/hours/holiday', body)
}
