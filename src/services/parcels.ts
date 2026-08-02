import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchParcels(): Promise<any> {
  return parse(await fetch('/api/parcels', { headers: authHeaders() }))
}
export async function createParcels(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/parcels', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchParcels(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/parcels/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runParcelsSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/parcels/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackParcelsFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/parcels/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ageParcelUndelivered(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/parcels/undelivered/age', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markParcelDelivered(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/parcels/deliver', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedFrontdeskParcelHold(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/parcels/hold/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
