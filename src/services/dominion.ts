import { authHeaders } from './auth'
export async function fetchDominion() {
  const res = await fetch('/api/dominion', { headers: authHeaders() })
  if (!res.ok) throw new Error('Dominion alınamadı')
  return res.json()
}
