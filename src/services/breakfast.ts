import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchBreakfast(): Promise<any> {
  return parse(await fetch('/api/breakfast', { headers: authHeaders() }))
}
export async function createBreakfast(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/breakfast', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchBreakfast(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/breakfast/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runBreakfastSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/breakfast/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackBreakfastFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/breakfast/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markBreakfastNoShowCovers(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/breakfast/noshow/cover', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seatBreakfastParty(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/breakfast/party/seat', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedBuffetRush(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/breakfast/buffet/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
