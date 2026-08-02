import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchLateout(): Promise<any> {
  return parse(await fetch('/api/lateout', { headers: authHeaders() }))
}
export async function createLateout(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/lateout', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchLateout(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/lateout/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runLateoutSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/lateout/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackLateoutFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/lateout/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markLateoutUnpaidFee(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/lateout/fee/unpaid', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function approveLateoutExtension(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/lateout/extension/approve', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedVipLateOut(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/lateout/vip/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
