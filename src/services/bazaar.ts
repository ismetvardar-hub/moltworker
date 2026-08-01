import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchBazaar() {
  return parse(await fetch('/api/bazaar', { headers: authHeaders() }))
}
export async function runBazaarSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/bazaar/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function healBazaarStock(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/bazaar/stock/heal', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function reviewBazaarShrink(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/bazaar/shrink/review', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function dispatchBazaarDark(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/bazaar/dark/dispatch', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackBazaarFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/bazaar/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

