import { authHeaders } from './auth'
export async function fetchSkyline() {
  const res = await fetch('/api/skyline', { headers: authHeaders() })
  if (!res.ok) throw new Error('Skyline alınamadı')
  return res.json()
}
