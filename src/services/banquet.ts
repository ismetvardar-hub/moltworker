import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchBanquet(): Promise<any> {
  return parse(await fetch('/api/banquet', { headers: authHeaders() }))
}
export async function createBanquet(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/banquet', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchBanquet(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/banquet/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runBanquetSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/banquet/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackBanquetFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/banquet/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markBanquetSetupOverdue(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/banquet/setup/overdue', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function confirmBanquetEvent(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/banquet/event/confirm', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedBanquetTasting(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/banquet/tasting/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
