import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchLinen() { return parse(await fetch('/api/linen', { headers: authHeaders() })) }
export async function runLinenSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/linen/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function passLinenInspect(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/linen/inspect/pass', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function releaseLinenOoo(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/linen/ooo/release', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function completeLinenHk(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/linen/hk/complete', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackLinenFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/linen/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

