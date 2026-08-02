import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchQrcheckin(): Promise<any> {
  return parse(await fetch('/api/qrcheckin', { headers: authHeaders() }))
}
export async function createQrcheckin(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/qrcheckin', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchQrcheckin(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/qrcheckin/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runQrcheckinSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/qrcheckin/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackQrcheckinFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/qrcheckin/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markQrcheckinInvalidScanSpike(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/qrcheckin/scan/invalid-spike', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function admitQrcheckinGuest(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/qrcheckin/admit', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedVipQr(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/qrcheckin/vip/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
