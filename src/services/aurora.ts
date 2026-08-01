import { authHeaders } from './auth'
export async function fetchAurora() {
  const res = await fetch('/api/aurora', { headers: authHeaders() })
  if (!res.ok) throw new Error('Aurora alınamadı')
  return res.json()
}
