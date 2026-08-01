import { authHeaders } from './auth'

export type Consent = {
  id: string
  subject: string
  phone: string | null
  purpose: string
  granted: boolean
  channel: string
  version: string
  note?: string
  at: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchConsents(): Promise<{
  consents: Consent[]
  granted: number
  denied: number
  purposes: string[]
}> {
  return parse(await fetch('/api/consents', { headers: authHeaders() }))
}

export async function recordConsent(input: {
  subject: string
  purpose: string
  granted: boolean
  phone?: string
  channel?: string
  note?: string
}): Promise<{ consent: Consent }> {
  return parse(
    await fetch('/api/consents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}
