import { authHeaders } from './auth'
export async function fetchBeacon() {
  const res = await fetch('/api/beacon', { headers: authHeaders() })
  if (!res.ok) throw new Error('Beacon alınamadı')
  return res.json()
}
