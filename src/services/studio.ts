import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchStudio() {
  return parse(await fetch('/api/studio', { headers: authHeaders() }))
}
export async function runStudioSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/studio/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function approveStudioUgc(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/studio/ugc/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function endStudioLive(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/studio/live/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function deliverStudioBrief(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/studio/brief/deliver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function ackStudioFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/studio/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

