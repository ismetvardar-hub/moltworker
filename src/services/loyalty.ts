import { authHeaders } from './auth'

export type LoyaltyAccount = {
  id: string
  guestId: string | null
  guestName: string
  phone: string | null
  points: number
  tier: string
  brandId?: string
  updatedAt?: string
}

export type LedgerEntry = {
  id: string
  at: string
  accountId: string
  guestName: string
  delta: number
  points: number
  reason: string
  note: string
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

export async function fetchLoyalty(): Promise<{
  accounts: LoyaltyAccount[]
  ledger: LedgerEntry[]
  totalPoints: number
  summary?: Record<string, unknown>
  flags?: unknown[]
  title?: string
}> {
  return parse(await fetch('/api/loyalty', { headers: authHeaders() }))
}

export async function adjustLoyalty(input: {
  accountId?: string
  guestName?: string
  phone?: string
  delta: number
  reason?: string
  note?: string
}): Promise<{ account: LoyaltyAccount; entry: LedgerEntry }> {
  return post<{ account: LoyaltyAccount; entry: LedgerEntry }>('/api/loyalty/adjust', input)
}

export async function runLoyaltySweep(body: Record<string, unknown> = {}) {
  return post('/api/loyalty/sweep', body)
}

export async function ackLoyaltyFlag(body: Record<string, unknown> = {}) {
  return post('/api/loyalty/flag/ack', body)
}

export async function awardLoyaltyPoints(body: Record<string, unknown> = {}) {
  return post('/api/loyalty/award', body)
}

export async function redeemLoyaltyPoints(body: Record<string, unknown> = {}) {
  return post('/api/loyalty/redeem', body)
}
