import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchBadgeprint(): Promise<any> {
  return parse(await fetch('/api/badgeprint', { headers: authHeaders() }))
}
export async function createBadgeprint(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/badgeprint', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchBadgeprint(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/badgeprint/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postBadgeprint(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runBadgeprintSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postBadgeprint('/api/badgeprint/sweep', body)
}
export async function ackBadgeprintFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postBadgeprint('/api/badgeprint/flag/ack', body)
}
export async function markBadgeprintQueueJam(body: Record<string, unknown> = {}): Promise<any> {
  return postBadgeprint('/api/badgeprint/queue-jam', body)
}
export async function reprintBadge(body: Record<string, unknown> = {}): Promise<any> {
  return postBadgeprint('/api/badgeprint/reprint', body)
}
export async function seedEventBadges(body: Record<string, unknown> = {}): Promise<any> {
  return postBadgeprint('/api/badgeprint/event-badges/seed', body)
}
