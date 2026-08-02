import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchWifi(): Promise<any> {
  return parse(await fetch('/api/wifi', { headers: authHeaders() }))
}
export async function createWifi(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/wifi', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(input) }))
}
export async function patchWifi(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/wifi/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) }))
}

export async function runWifiSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/wifi/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackWifiFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/wifi/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function flagWifiCaptivePortalIssue(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/wifi/portal/issue', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function resetWifiAccessPoint(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/wifi/ap/reset', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedGuestWifiVoucher(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/wifi/voucher/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
