import { authHeaders } from './auth'
export async function fetchAegis() {
  const res = await fetch('/api/aegis', { headers: authHeaders() })
  if (!res.ok) throw new Error('Aegis alınamadı')
  return res.json()
}
