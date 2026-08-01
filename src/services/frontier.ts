import { authHeaders } from './auth'
export async function fetchFrontier() {
  const res = await fetch('/api/frontier', { headers: authHeaders() })
  if (!res.ok) throw new Error('Frontier alınamadı')
  return res.json()
}
