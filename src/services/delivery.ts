import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchDelivery(): Promise<any> {
  return parse(await fetch('/api/delivery', { headers: authHeaders() }))
}
export async function createDelivery(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/delivery', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(input) }))
}
export async function patchDelivery(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/delivery/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) }))
}

export async function runDeliverySweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/delivery/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackDeliveryFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/delivery/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function markDeliveryDelivered(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/delivery/delivered', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function delayDeliveryEta(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/delivery/eta/delay', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function seedPendingDelivery(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/delivery/pending/seed', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
