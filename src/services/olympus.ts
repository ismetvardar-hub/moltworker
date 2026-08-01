import { authHeaders } from './auth'
export async function fetchOlympus() {
  const res = await fetch('/api/olympus', { headers: authHeaders() })
  if (!res.ok) throw new Error('Olympus alınamadı')
  return res.json()
}
