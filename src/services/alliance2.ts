import { authHeaders } from './auth'
export async function fetchAlliance2() {
  const res = await fetch('/api/alliance2', { headers: authHeaders() })
  if (!res.ok) throw new Error('Alliance2 alınamadı')
  return res.json()
}
