import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPartners(): Promise<any> {
  return parse(await fetch('/api/partners', { headers: authHeaders() }))
}
export async function createPartners(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/partners', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchPartners(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/partners/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postPartners(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runPartnersSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postPartners('/api/partners/sweep', body)
}
export async function ackPartnersFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postPartners('/api/partners/flag/ack', body)
}
export async function markPartnersInactive(body: Record<string, unknown> = {}): Promise<any> {
  return postPartners('/api/partners/inactive', body)
}
export async function renewPartner(body: Record<string, unknown> = {}): Promise<any> {
  return postPartners('/api/partners/renew', body)
}
export async function seedChannelDeal(body: Record<string, unknown> = {}): Promise<any> {
  return postPartners('/api/partners/channel-deal/seed', body)
}
