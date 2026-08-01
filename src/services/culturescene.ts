import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCultureScene() {
  return parse(await fetch('/api/culture', { headers: authHeaders() }))
}
export async function createCultureEvent(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function holdCultureTicket(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function confirmCultureTicket(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function releaseCultureHold(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function setCultureLive(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
