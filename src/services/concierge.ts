import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchConcierge(): Promise<any> {
  return parse(await fetch('/api/concierge', { headers: authHeaders() }))
}
export async function createConcierge(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/concierge', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchConcierge(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/concierge/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runConciergeSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/concierge/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackConciergeFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/concierge/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ageConciergeRequest(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/concierge/request/age', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function fulfillConciergeRequest(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/concierge/fulfill', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedVipConciergeAsk(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/concierge/vip/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
