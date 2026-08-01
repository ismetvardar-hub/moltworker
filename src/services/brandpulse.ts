import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchBrandpulse() {
  return parse(await fetch('/api/brandpulse', { headers: authHeaders() }))
}
export async function runBrandpulseSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/brandpulse/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function ackBrandpulseFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/brandpulse/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function triageBrandpulseInbox(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/brandpulse/inbox/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function approveBrandpulseUgc(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/brandpulse/ugc/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function actionBrandpulseGuard(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/brandpulse/guard/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
