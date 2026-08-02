import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

async function post(path: string, body: Record<string, unknown> = {}) {
  return parse(
    await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function fetchKudos(): Promise<any> {
  return parse(await fetch('/api/kudos', { headers: authHeaders() }))
}

export async function createKudos(input: Record<string, unknown>): Promise<any> {
  return post('/api/kudos', input)
}

export async function runKudosSweep(body: Record<string, unknown> = {}) {
  return post('/api/kudos/sweep', body)
}

export async function ackKudosFlag(body: Record<string, unknown> = {}) {
  return post('/api/kudos/flag/ack', body)
}

export async function createThankYouBurst(body: Record<string, unknown> = {}) {
  return post('/api/kudos/burst', body)
}

export async function refreshKudosTagFilter(body: Record<string, unknown> = {}) {
  return post('/api/kudos/tags/refresh', body)
}

export async function seedDailyKudos(body: Record<string, unknown> = {}) {
  return post('/api/kudos/daily/seed', body)
}
