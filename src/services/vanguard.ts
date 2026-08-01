import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchVanguard() {
  return parse(await fetch('/api/vanguard', { headers: authHeaders() }))
}
export async function runVanguardSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/vanguard/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function ackVanguardFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/vanguard/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function forceVanguardPosOnline(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/vanguard/pos/online', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function clearVanguardInvDrift(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/vanguard/inv/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function flushVanguardMintQueue(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/vanguard/mint/flush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
