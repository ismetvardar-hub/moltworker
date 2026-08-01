import { authHeaders } from './auth'
export async function fetchBrandpulse() {
  const res = await fetch('/api/brandpulse', { headers: authHeaders() })
  if (!res.ok) throw new Error('Brand pulse alınamadı')
  return res.json()
}
