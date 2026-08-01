import { authHeaders } from './auth'
export async function fetchCognisphere() {
  const res = await fetch('/api/cognisphere', { headers: authHeaders() })
  if (!res.ok) throw new Error('Cognisphere alınamadı')
  return res.json()
}
