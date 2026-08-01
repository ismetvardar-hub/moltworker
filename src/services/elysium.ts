import { authHeaders } from './auth'
export async function fetchElysium() {
  const res = await fetch('/api/elysium', { headers: authHeaders() })
  if (!res.ok) throw new Error('Elysium alınamadı')
  return res.json()
}
