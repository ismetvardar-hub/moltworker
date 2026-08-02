import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchFlorals(): Promise<any> {
  return parse(await fetch('/api/florals', { headers: authHeaders() }))
}
export async function createFlorals(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/florals', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchFlorals(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/florals/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postFlorals(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runFloralsSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postFlorals('/api/florals/sweep', body)
}
export async function ackFloralsFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postFlorals('/api/florals/flag/ack', body)
}
export async function markFloralsWiltedArrangement(body: Record<string, unknown> = {}): Promise<any> {
  return postFlorals('/api/florals/wilted', body)
}
export async function refreshFloralsVase(body: Record<string, unknown> = {}): Promise<any> {
  return postFlorals('/api/florals/vase/refresh', body)
}
export async function seedWeddingPackage(body: Record<string, unknown> = {}): Promise<any> {
  return postFlorals('/api/florals/wedding-package/seed', body)
}
