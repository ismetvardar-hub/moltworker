import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchReadiness(): Promise<any> {
  return parse(await fetch('/api/readiness', { headers: authHeaders() }))
}

export async function refreshReadinessSnapshot(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/readiness/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function setReadinessThreshold(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/readiness/threshold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function ackReadinessDimension(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/readiness/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function escalateReadinessGap(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/readiness/escalate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function resolveReadinessGap(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/readiness/gap/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
