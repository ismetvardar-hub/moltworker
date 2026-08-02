import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchUpsell(): Promise<any> {
  return parse(await fetch('/api/upsell', { headers: authHeaders() }))
}
export async function createUpsell(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/upsell', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchUpsell(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/upsell/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runUpsellSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/upsell/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackUpsellFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/upsell/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ageUpsellPendingOffer(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/upsell/offer/age', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function acceptUpsellOffer(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/upsell/offer/accept', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedLateCheckoutOffer(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/upsell/latecheckout/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
