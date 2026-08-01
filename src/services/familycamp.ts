import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchFamilyCamp() {
  return parse(await fetch('/api/familycamp', { headers: authHeaders() }))
}
export async function familyCheckIn(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/familycamp/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function familyCheckOut(id?: string) {
  return parse(
    await fetch('/api/familycamp/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ id }),
    }),
  )
}
export async function bookFamilyProgram(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/familycamp/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function familyEmergencyNote(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/familycamp/emergency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function transferFamilyChild(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/familycamp/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
