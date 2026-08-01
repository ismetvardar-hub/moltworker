import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchStayRing() {
  return parse(await fetch('/api/stayring', { headers: authHeaders() }))
}

export async function createStayBooking(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/stayring/book', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

