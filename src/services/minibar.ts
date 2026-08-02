import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchMinibar(): Promise<any> {
  return parse(await fetch('/api/minibar', { headers: authHeaders() }))
}
export async function createMinibar(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/minibar', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchMinibar(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/minibar/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runMinibarSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/minibar/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackMinibarFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/minibar/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function restockDueMinibar(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/minibar/restock/due', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function chargeMinibarFolio(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/minibar/folio/charge', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedEmptyMinibarFridge(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/minibar/empty/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
