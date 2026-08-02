import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchBedding(): Promise<any> {
  return parse(await fetch('/api/bedding', { headers: authHeaders() }))
}
export async function createBedding(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/bedding', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchBedding(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/bedding/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postBedding(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runBeddingSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postBedding('/api/bedding/sweep', body)
}
export async function ackBeddingFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postBedding('/api/bedding/flag/ack', body)
}
export async function markBeddingLinenShortage(body: Record<string, unknown> = {}): Promise<any> {
  return postBedding('/api/bedding/linen/shortage', body)
}
export async function restockBeddingLinen(body: Record<string, unknown> = {}): Promise<any> {
  return postBedding('/api/bedding/restock', body)
}
export async function seedTurndownKit(body: Record<string, unknown> = {}): Promise<any> {
  return postBedding('/api/bedding/turndown-kit/seed', body)
}
