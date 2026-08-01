import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchLedger() {
  return parse(await fetch('/api/ledger', { headers: authHeaders() }))
}
export async function runLedgerSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/ledger/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function collectLedgerAr(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/ledger/ar/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function resolveLedgerChargeback(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/ledger/chargeback/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function clearLedgerChannel(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/ledger/channel/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function ackLedgerFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/ledger/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

