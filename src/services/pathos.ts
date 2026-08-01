import { authHeaders } from './auth'
export async function fetchPathos() {
  const res = await fetch('/api/pathos', { headers: authHeaders() })
  if (!res.ok) throw new Error('Pathos alınamadı')
  return res.json()
}
