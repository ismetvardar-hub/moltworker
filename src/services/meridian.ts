import { authHeaders } from './auth'
export async function fetchMeridian() {
  const res = await fetch('/api/meridian', { headers: authHeaders() })
  if (!res.ok) throw new Error('Meridian alınamadı')
  return res.json()
}
