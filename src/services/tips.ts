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

export async function fetchTips(): Promise<{
  balance: number
  currency: string
  todayIn: number
  todayOut: number
  entries: TipEntry[]
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
  return parse(
    await fetch('/api/tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}
