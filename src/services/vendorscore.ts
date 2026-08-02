import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchVendorscore(): Promise<any> {
  return parse(await fetch('/api/vendor-scores', { headers: authHeaders() }))
}

export async function runVendorscoreSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/vendorscore/sweep', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}

export async function ackVendorscoreFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/vendorscore/flag/ack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}

export async function reviewVendorScore(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/vendorscore/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}

export async function flagVendorUnderperformance(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/vendorscore/underperform', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}

export async function seedVendorScore(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/vendorscore/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}







