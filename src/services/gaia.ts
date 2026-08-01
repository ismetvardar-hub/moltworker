import { authHeaders } from './auth'
export async function fetchGaia() {
  const res = await fetch('/api/gaia', { headers: authHeaders() })
  if (!res.ok) throw new Error('Gaia alınamadı')
  return res.json()
}
