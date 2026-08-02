import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchMarina(): Promise<any> {
  return parse(await fetch('/api/marina', { headers: authHeaders() }))
}
export async function createMarina(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/marina', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchMarina(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/marina/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runMarinaSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/marina/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackMarinaFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/marina/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markMarinaBerthOverdue(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/marina/berth/overdue', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function clearMarinaSlip(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/marina/slip/clear', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedMarinaArrival(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/marina/arrival/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
