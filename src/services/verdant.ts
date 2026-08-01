import { authHeaders } from './auth'
export async function fetchVerdant() {
  const res = await fetch('/api/verdant', { headers: authHeaders() })
  if (!res.ok) throw new Error('Verdant alınamadı')
  return res.json()
}
