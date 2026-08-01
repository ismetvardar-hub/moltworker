import { authHeaders } from './auth'
export async function fetchZenith() {
  const res = await fetch('/api/zenith', { headers: authHeaders() })
  if (!res.ok) throw new Error('Zenith alınamadı')
  return res.json()
}
