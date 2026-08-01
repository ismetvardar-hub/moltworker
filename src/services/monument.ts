import { authHeaders } from './auth'
export async function fetchMonument() {
  const res = await fetch('/api/monument', { headers: authHeaders() })
  if (!res.ok) throw new Error('Monument alınamadı')
  return res.json()
}
