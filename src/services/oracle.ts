import { authHeaders } from './auth'
export async function fetchOracle() {
  const res = await fetch('/api/oracle', { headers: authHeaders() })
  if (!res.ok) throw new Error('Oracle alınamadı')
  return res.json()
}
