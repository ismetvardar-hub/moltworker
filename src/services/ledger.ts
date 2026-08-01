import { authHeaders } from './auth'
export async function fetchLedger() {
  const res = await fetch('/api/ledger', { headers: authHeaders() })
  if (!res.ok) throw new Error('Ledger alınamadı')
  return res.json()
}
