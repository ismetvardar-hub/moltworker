import { authHeaders } from './auth'
export async function fetchAlliance3() {
  const res = await fetch('/api/alliance3', { headers: authHeaders() })
  if (!res.ok) throw new Error('Alliance3 alınamadı')
  return res.json()
}
