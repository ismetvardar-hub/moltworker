import { authHeaders } from './auth'
export async function fetchCitadel() {
  const res = await fetch('/api/citadel', { headers: authHeaders() })
  if (!res.ok) throw new Error('Citadel alınamadı')
  return res.json()
}
