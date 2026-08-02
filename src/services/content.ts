import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchContent(): Promise<any> {
  return parse(await fetch('/api/content', { headers: authHeaders() }))
}
export async function createContent(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/content', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(input) }))
}
export async function patchContent(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/content/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) }))
}

export async function runContentSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/content/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackContentFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/content/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function markContentStaleDraft(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/content/draft/stale', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function publishContentItem(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/content/publish', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function seedCampaignPost(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/content/campaign-post/seed', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
