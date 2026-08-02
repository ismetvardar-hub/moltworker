import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPrivatechef(): Promise<any> {
  return parse(await fetch('/api/privatechef', { headers: authHeaders() }))
}
export async function createPrivatechef(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/privatechef', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchPrivatechef(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/privatechef/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runPrivatechefSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/privatechef/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackPrivatechefFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/privatechef/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markPrivatechefMenuPending(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/privatechef/menu/pending', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function confirmPrivatechefBooking(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/privatechef/booking/confirm', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedTastingMenu(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/privatechef/tasting/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
