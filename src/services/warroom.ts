import { authHeaders } from './auth'
export async function fetchWarroom() {
  const res = await fetch('/api/warroom', { headers: authHeaders() })
  if (!res.ok) throw new Error('War room alınamadı')
  return res.json()
}
