import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchLockers(): Promise<any> {
  return parse(await fetch('/api/lockers', { headers: authHeaders() }))
}
export async function createLockers(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/lockers', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchLockers(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/lockers/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runLockersSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/lockers/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackLockersFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/lockers/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markLockersOverdueRental(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/lockers/rental/overdue', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function releaseLocker(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/lockers/release', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedLockerDayPass(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/lockers/day-pass/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
