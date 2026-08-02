import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchGuestapp(): Promise<any> {
  return parse(await fetch('/api/guestapp', { headers: authHeaders() }))
}
export async function createGuestapp(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/guestapp', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchGuestapp(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/guestapp/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postGuestapp(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runGuestappSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postGuestapp('/api/guestapp/sweep', body)
}
export async function ackGuestappFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postGuestapp('/api/guestapp/flag/ack', body)
}
export async function markGuestappPushFailure(body: Record<string, unknown> = {}): Promise<any> {
  return postGuestapp('/api/guestapp/push/failure', body)
}
export async function republishGuestappScreen(body: Record<string, unknown> = {}): Promise<any> {
  return postGuestapp('/api/guestapp/screen/republish', body)
}
export async function seedWelcomeCard(body: Record<string, unknown> = {}): Promise<any> {
  return postGuestapp('/api/guestapp/welcome-card/seed', body)
}
