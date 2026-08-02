import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchAllergens(): Promise<any> {
  return parse(await fetch('/api/allergens', { headers: authHeaders() }))
}
export async function createAllergens(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/allergens', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}

export async function patchAllergens(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/allergens/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runAllergensSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/allergens/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackAllergensFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/allergens/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markAllergensUnlabeledDish(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/allergens/dish/unlabeled', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function flagAllergensMenuItem(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/allergens/menu-item/flag', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedGuestAllergenAlert(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/allergens/guest-alert/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
