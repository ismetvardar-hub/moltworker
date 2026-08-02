import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCleaning(): Promise<any> {
  return parse(await fetch('/api/cleaning', { headers: authHeaders() }))
}
export async function createCleaning(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/cleaning', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(input) }))
}
export async function patchCleaning(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/cleaning/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) }))
}

export async function runCleaningSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/cleaning/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackCleaningFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/cleaning/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function markCleaningClean(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/cleaning/clean', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function failCleaningInspection(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/cleaning/inspection/fail', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function seedCleaningInspectionFail(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/cleaning/inspection/seed', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
