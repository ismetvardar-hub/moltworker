import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchGiftcards(): Promise<any> {
  return parse(await fetch('/api/giftcards', { headers: authHeaders() }))
}
export async function createGiftcards(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/giftcards', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(input) }))
}
export async function patchGiftcards(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/giftcards/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) }))
}

export async function runGiftcardsSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/giftcards/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackGiftcardsFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/giftcards/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function redeemGiftcardOps(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/giftcards/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function topUpGiftcardOps(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/giftcards/topup', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function seedPromoGiftcard(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/giftcards/promo/seed', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
