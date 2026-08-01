import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchWarroom() {
  return parse(await fetch('/api/warroom', { headers: authHeaders() }))
}
export async function runWarroomSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/warroom/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function ackWarroomFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/warroom/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function clearWarroomHaccp(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/warroom/haccp/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function clearWarroomPatrol(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/warroom/patrol/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function closeWarroomConcierge(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/warroom/concierge/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
