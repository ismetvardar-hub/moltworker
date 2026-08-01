import { authHeaders } from './auth'

export type Reservation = {
  id: string
  date: string
  time: string
  partySize: number
  guestName: string
  phone: string | null
  venueId: string
  brandId?: string
  table: string | null
  status: string
  note: string
  createdAt?: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function listReservations(params?: {
  date?: string
  venueId?: string
  status?: string
}): Promise<{
  reservations: Reservation[]
  todayCount: number
  pending: number
  confirmed: number
}> {
  const q = new URLSearchParams()
  if (params?.date) q.set('date', params.date)
  if (params?.venueId) q.set('venueId', params.venueId)
  if (params?.status) q.set('status', params.status)
  const qs = q.toString()
  return parse(await fetch(`/api/reservations${qs ? `?${qs}` : ''}`, { headers: authHeaders() }))
}

export async function createReservation(
  input: Partial<Reservation> & { guestName: string },
): Promise<{ reservation: Reservation }> {
  return parse(
    await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}

export async function updateReservation(
  id: string,
  patch: Partial<Reservation>,
): Promise<{ reservation: Reservation }> {
  return parse(
    await fetch(`/api/reservations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch),
    }),
  )
}

export async function deleteReservation(id: string): Promise<void> {
  await parse(
    await fetch(`/api/reservations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),
  )
}
