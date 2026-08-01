import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchOracle() {
  return parse(await fetch('/api/oracle', { headers: authHeaders() }))
}
export async function runOracleSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/oracle/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function ackOracleFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/oracle/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function resolveOracleAnomaly(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/oracle/anomaly/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function clearOracleScoreRed(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/oracle/score/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function promoteOracleCanary(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/oracle/canary/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
