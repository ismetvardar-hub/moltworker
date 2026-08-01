import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchMarketOs() {
  return parse(await fetch('/api/marketos', { headers: authHeaders() }))
}
export async function createMarketListing(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/marketos/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function marketCheckout(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/marketos/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function syncMarketChannel(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/marketos/channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function returnMarketRental(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/marketos/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
