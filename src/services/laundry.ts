import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchLaundry(): Promise<any> {
  return parse(await fetch('/api/laundry', { headers: authHeaders() }))
}
export async function createLaundry(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/laundry', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(input) }))
}
export async function patchLaundry(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/laundry/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) }))
}

export async function runLaundrySweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/laundry/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackLaundryFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/laundry/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function markLaundryReady(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/laundry/ready', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function returnLaundryBatch(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/laundry/return', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function seedRushLaundryOrder(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/laundry/rush/seed', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
