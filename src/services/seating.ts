import { authHeaders } from './auth'

export type SeatingTable = {
  id: string
  label: string
  seats: number
  venueId: string
  status: 'free' | 'occupied' | 'reserved' | string
  partyName?: string
  partySize?: number
  reservationId?: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

async function post<T = unknown>(path: string, body: Record<string, unknown> = {}) {
  return parse<T>(await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}

export async function fetchSeating(): Promise<{
  tables: SeatingTable[]
  total: number
  free: number
  occupied: number
  reserved: number
  occupiedTooLong?: number
  reservedWithoutParty?: number
  invalidStatus?: number
  flags?: unknown[]
  summary?: Record<string, unknown>
  summaryLines?: string[]
  title?: string
}> {
  return parse(await fetch('/api/seating', { headers: authHeaders() }))
}

export async function createSeating(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/seating', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  }))
}

export async function patchSeating(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/seating/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch),
  }))
}

export async function runSeatingSweep(body: Record<string, unknown> = {}) {
  return post('/api/seating/sweep', body)
}

export async function ackSeatingFlag(body: Record<string, unknown> = {}) {
  return post('/api/seating/flag/ack', body)
}

export async function seatWalkInParty(body: Record<string, unknown> = {}) {
  return post('/api/seating/walk-in', body)
}

export async function clearSeatingTable(body: Record<string, unknown> = {}) {
  return post('/api/seating/clear', body)
}

export async function reserveSeatingTable(body: Record<string, unknown> = {}) {
  return post('/api/seating/reserve', body)
}



