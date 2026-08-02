import { authHeaders } from './auth'

export type Consent = {
  id: string
  subject: string
  phone: string | null
  purpose: string
  granted: boolean
  channel: string
  version: string
  status?: string
  note?: string
  at: string
}

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

export async function fetchConsents(): Promise<{
  consents: Consent[]
  granted: number
  denied: number
  purposes: string[]
  summary?: Record<string, unknown>
  flags?: unknown[]
  title?: string
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
  return post('/api/consents', input)
}

export async function runConsentSweep(body: Record<string, unknown> = {}) {
  return post('/api/consents/sweep', body)
}

export async function ackConsentFlag(body: Record<string, unknown> = {}) {
  return post('/api/consents/flag/ack', body)
}

export async function recordConsentOps(body: Record<string, unknown> = {}) {
  return post('/api/consents/record', body)
}

export async function revokeConsent(body: Record<string, unknown> = {}) {
  return post('/api/consents/revoke', body)
}

export async function seedMissingConsents(body: Record<string, unknown> = {}) {
  return post('/api/consents/missing/seed', body)
}
