import { authHeaders } from './auth'

export type TipEntry = {
  id: string
  kind: string
  amount: number
  balance: number
  person: string | null
  venueId: string | null
  note: string
  at: string
  actor: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

async function post<T = unknown>(path: string, body: Record<string, unknown> = {}) {
  return parse<T>(
    await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function fetchTips(): Promise<{
  balance: number
  currency: string
  todayIn: number
  todayOut: number
  entries: TipEntry[]
  summary?: Record<string, unknown>
  flags?: unknown[]
  title?: string
}> {
  return parse(await fetch('/api/tips', { headers: authHeaders() }))
}

export async function postTip(input: {
  amount: number
  kind?: string
  note?: string
  person?: string
  venueId?: string
}): Promise<{ pool: { balance: number }; entry: TipEntry }> {
  return post<{ pool: { balance: number }; entry: TipEntry }>('/api/tips', input)
}

export async function runTipsSweep(body: Record<string, unknown> = {}) {
  return post('/api/tips/sweep', body)
}

export async function ackTipsFlag(body: Record<string, unknown> = {}) {
  return post('/api/tips/flag/ack', body)
}

export async function addTipIn(body: Record<string, unknown> = {}) {
  return post('/api/tips/in', body)
}

export async function addTipOut(body: Record<string, unknown> = {}) {
  return post('/api/tips/out', body)
}

export async function tipBalanceSnapshot(body: Record<string, unknown> = {}) {
  return post('/api/tips/balance/snapshot', body)
}
