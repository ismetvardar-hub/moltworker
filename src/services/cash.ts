import { authHeaders } from './auth'

export type CashEntry = {
  id: string
  venueId: string
  kind: string
  amount: number
  balance: number
  reason: string
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

export async function fetchCash(): Promise<{
  drawer: { venueId: string; balance: number; currency: string }
  todayIn: number
  todayOut: number
  entries: CashEntry[]
  flags?: unknown[]
  summary?: Record<string, unknown>
  summaryLines?: string[]
  title?: string
  imbalances?: number
  largeDrops?: number
  missingDailyClose?: number
}> {
  return parse(await fetch('/api/cash', { headers: authHeaders() }))
}

export async function postCash(input: {
  amount: number
  kind?: string
  note?: string
  reason?: string
  venueId?: string
}): Promise<{ drawer: { balance: number }; entry: CashEntry }> {
  return parse(
    await fetch('/api/cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}

export async function runCashSweep(body: Record<string, unknown> = {}) {
  return post('/api/cash/sweep', body)
}

export async function ackCashFlag(body: Record<string, unknown> = {}) {
  return post('/api/cash/flag/ack', body)
}

export async function postCashEntry(body: Record<string, unknown> = {}) {
  return post('/api/cash/entry', body)
}

export async function flagCashImbalance(body: Record<string, unknown> = {}) {
  return post('/api/cash/imbalance/flag', body)
}

export async function seedCashDailyClose(body: Record<string, unknown> = {}) {
  return post('/api/cash/daily-close/seed', body)
}
