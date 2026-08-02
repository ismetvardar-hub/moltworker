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

export async function fetchWaste(): Promise<any> {
  return parse(await fetch('/api/waste', { headers: authHeaders() }))
}

export async function createWaste(input: Record<string, unknown>): Promise<any> {
  return post('/api/waste', input)
}

export async function runWasteSweep(body: Record<string, unknown> = {}) {
  return post('/api/waste/sweep', body)
}

export async function ackWasteFlag(body: Record<string, unknown> = {}) {
  return post('/api/waste/flag/ack', body)
}

export async function recordWasteLog(body: Record<string, unknown> = {}) {
  return post('/api/waste/log', body)
}

export async function flagWasteOverage(body: Record<string, unknown> = {}) {
  return post('/api/waste/overage/flag', body)
}

export async function seedWasteCategory(body: Record<string, unknown> = {}) {
  return post('/api/waste/category/seed', body)
}
