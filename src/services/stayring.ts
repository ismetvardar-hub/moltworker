import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchStayRing() {
  return parse(await fetch('/api/stayring', { headers: authHeaders() }))
}
export async function createStayBooking(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/stayring/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function issueStayKeyless(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/stayring/keyless', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function setStayWintering(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/stayring/winter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function createStayHkTask(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/stayring/hk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function checkoutStay(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/stayring/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function completeStayHk(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/stayring/hk-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function stayNightRollup(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/stayring/night-rollup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
