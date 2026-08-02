import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPassstock(): Promise<any> {
  return parse(await fetch('/api/passstock', { headers: authHeaders() }))
}
export async function createPassstock(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/passstock', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(input) }))
}
export async function patchPassstock(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/passstock/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) }))
}

export async function runPassstockSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/passstock/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackPassstockFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/passstock/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function markPassstockLowWristbandStock(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/passstock/wristband/low-stock', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function restockPassstock(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/passstock/restock', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function seedEventBatch(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/passstock/event-batch/seed', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
