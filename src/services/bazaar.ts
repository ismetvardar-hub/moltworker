import { authHeaders } from './auth'
export async function fetchBazaar() {
  const res = await fetch('/api/bazaar', { headers: authHeaders() })
  if (!res.ok) throw new Error('Bazaar alınamadı')
  return res.json()
}
