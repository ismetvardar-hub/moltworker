import { authHeaders } from './auth'
export async function fetchSanctum() {
  const res = await fetch('/api/sanctum', { headers: authHeaders() })
  if (!res.ok) throw new Error('Sanctum alınamadı')
  return res.json()
}
