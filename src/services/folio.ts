import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchFolio(): Promise<any> {
  return parse(await fetch('/api/folio', { headers: authHeaders() }))
}
export async function createFolio(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/folio', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchFolio(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/folio/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runFolioSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/folio/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackFolioFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/folio/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function postFolioCharge(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/folio/charge/post', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function settleFolioBalance(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/folio/balance/settle', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedFolioDispute(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/folio/dispute/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
