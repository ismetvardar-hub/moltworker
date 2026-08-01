import { authHeaders } from './auth'
export async function fetchApotheosis() {
  const res = await fetch('/api/apotheosis', { headers: authHeaders() })
  if (!res.ok) throw new Error('Apotheosis alınamadı')
  return res.json()
}
