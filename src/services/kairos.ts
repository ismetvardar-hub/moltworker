import { authHeaders } from './auth'
export async function fetchKairos() {
  const res = await fetch('/api/kairos', { headers: authHeaders() })
  if (!res.ok) throw new Error('Kairos alınamadı')
  return res.json()
}
