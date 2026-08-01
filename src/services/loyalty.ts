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

export async function fetchLoyalty(): Promise<{
  accounts: LoyaltyAccount[]
  ledger: LedgerEntry[]
  totalPoints: number
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
  return parse(
    await fetch('/api/loyalty/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}
