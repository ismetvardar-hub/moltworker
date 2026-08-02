import { authHeaders } from './auth'

export type Shift = {
  id: string
  date: string
  role: string
  person: string
  start: string
  end: string
  venueId: string | null
  brandId?: string
  status: string
  createdAt?: string
  updatedAt?: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function listShifts(params?: {
  venueId?: string
  date?: string
  brandId?: string
}): Promise<{
  shifts: Shift[]
  flags?: any[]
  summary?: any
  summaryLines?: string[]
  title?: string
  todayCount?: number
  gaps?: number
}> {
  const q = new URLSearchParams()
  if (params?.venueId) q.set('venueId', params.venueId)
  if (params?.date) q.set('date', params.date)
  if (params?.brandId) q.set('brandId', params.brandId)
  const qs = q.toString()
  return parse(await fetch(`/api/shifts${qs ? `?${qs}` : ''}`, { headers: authHeaders() }))
}

export async function createShift(input: {
  venueId?: string
  role: string
  person: string
  date?: string
  start: string
  end: string
  status?: string
  brandId?: string
}): Promise<{ shift: Shift }> {
  return parse(
    await fetch('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}

export async function updateShift(
  id: string,
  patch: Partial<Pick<Shift, 'venueId' | 'role' | 'person' | 'date' | 'start' | 'end' | 'status'>>,
): Promise<{ shift: Shift }> {
  return parse(
    await fetch(`/api/shifts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch),
    }),
  )
}

export async function deleteShift(id: string): Promise<void> {
  await parse(await fetch(`/api/shifts/${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders() }))
}

export async function runShiftsSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/shifts/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackShiftsFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/shifts/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function openCoverShiftGap(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/shifts/gap/cover', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function closeShiftOps(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/shifts/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function assignShiftStaff(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/shifts/staff/assign', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
