import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

async function post<T = unknown>(path: string, body: Record<string, unknown> = {}) {
  return parse<T>(await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}

export async function fetchValet(): Promise<any> {
  return parse(await fetch('/api/valet', { headers: authHeaders() }))
}

export async function createValet(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/valet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  }))
}

export async function patchValet(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/valet/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch),
  }))
}

export async function runValetSweep(body: Record<string, unknown> = {}) {
  return post('/api/valet/sweep', body)
}

export async function ackValetFlag(body: Record<string, unknown> = {}) {
  return post('/api/valet/flag/ack', body)
}

export async function requestValetPickup(body: Record<string, unknown> = {}) {
  return post('/api/valet/pickup/request', body)
}

export async function deliverValetVehicle(body: Record<string, unknown> = {}) {
  return post('/api/valet/deliver', body)
}

export async function seedLongParkedValetTicket(body: Record<string, unknown> = {}) {
  return post('/api/valet/long-parked/seed', body)
}