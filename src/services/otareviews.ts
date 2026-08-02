import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchOtareviews(): Promise<any> {
  return parse(await fetch('/api/otareviews', { headers: authHeaders() }))
}
export async function createOtareviews(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/otareviews', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchOtareviews(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/otareviews/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postOtareviews(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runOtareviewsSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postOtareviews('/api/otareviews/sweep', body)
}
export async function ackOtareviewsFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postOtareviews('/api/otareviews/flag/ack', body)
}
export async function markOtareviewsLowScoreSpike(body: Record<string, unknown> = {}): Promise<any> {
  return postOtareviews('/api/otareviews/low-score/spike', body)
}
export async function draftOtareviewsReply(body: Record<string, unknown> = {}): Promise<any> {
  return postOtareviews('/api/otareviews/reply/draft', body)
}
export async function seedOtareviewsRecoveryOffer(body: Record<string, unknown> = {}): Promise<any> {
  return postOtareviews('/api/otareviews/recovery-offer/seed', body)
}
