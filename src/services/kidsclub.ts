import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchKidsclub(): Promise<any> {
  return parse(await fetch('/api/kidsclub', { headers: authHeaders() }))
}
export async function createKidsclub(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/kidsclub', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchKidsclub(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/kidsclub/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runKidsclubSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/kidsclub/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackKidsclubFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/kidsclub/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markKidsclubUncheckedChild(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/kidsclub/unchecked', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function checkInKidsclubChild(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/kidsclub/checkin', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedKidsclubActivitySlot(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/kidsclub/activity-slot/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
