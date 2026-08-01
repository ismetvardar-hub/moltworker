import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchApex() {
  return parse(await fetch('/api/apex', { headers: authHeaders() }))
}
export async function runApexSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/apex/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function clearApexInvoices(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/apex/invoice/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function renewApexLicenses(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/apex/license/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function approveApexOvertime(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/apex/overtime/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function ackApexFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/apex/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

