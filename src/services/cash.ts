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

export async function fetchCash(): Promise<{
  drawer: { venueId: string; balance: number; currency: string }
  todayIn: number
  todayOut: number
  entries: CashEntry[]
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
