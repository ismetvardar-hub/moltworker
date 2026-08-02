import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchVipnotes(): Promise<any> {
  return parse(await fetch('/api/vipnotes', { headers: authHeaders() }))
}
export async function createVipnotes(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/vipnotes', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchVipnotes(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/vipnotes/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postVipnotes(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runVipnotesSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postVipnotes('/api/vipnotes/sweep', body)
}
export async function ackVipnotesFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postVipnotes('/api/vipnotes/flag/ack', body)
}
export async function markVipnotesUnreadAlert(body: Record<string, unknown> = {}): Promise<any> {
  return postVipnotes('/api/vipnotes/alert/unread', body)
}
export async function acknowledgeVipnote(body: Record<string, unknown> = {}): Promise<any> {
  return postVipnotes('/api/vipnotes/acknowledge', body)
}
export async function seedVipArrivalBrief(body: Record<string, unknown> = {}): Promise<any> {
  return postVipnotes('/api/vipnotes/arrival-brief/seed', body)
}
