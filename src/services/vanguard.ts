import { authHeaders } from './auth'
export async function fetchVanguard() {
  const res = await fetch('/api/vanguard', { headers: authHeaders() })
  if (!res.ok) throw new Error('Vanguard alınamadı')
  return res.json()
}
