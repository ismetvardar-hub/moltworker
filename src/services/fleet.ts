import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchFleet(): Promise<any> {
  return parse(await fetch('/api/fleet', { headers: authHeaders() }))
}
export async function createFleet(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/fleet', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchFleet(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/fleet/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postFleet(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runFleetSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postFleet('/api/fleet/sweep', body)
}
export async function ackFleetFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postFleet('/api/fleet/flag/ack', body)
}
export async function markFleetServiceDue(body: Record<string, unknown> = {}): Promise<any> {
  return postFleet('/api/fleet/service/due', body)
}
export async function dispatchFleetVehicle(body: Record<string, unknown> = {}): Promise<any> {
  return postFleet('/api/fleet/dispatch', body)
}
export async function seedShuttleVan(body: Record<string, unknown> = {}): Promise<any> {
  return postFleet('/api/fleet/shuttle-van/seed', body)
}
