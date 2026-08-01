import { authHeaders } from './auth'
export async function fetchDominion2() {
  const res = await fetch('/api/dominion2', { headers: authHeaders() })
  if (!res.ok) throw new Error('Dominion2 alınamadı')
  return res.json()
}
