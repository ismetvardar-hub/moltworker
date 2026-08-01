import { authHeaders } from './auth'
export async function fetchTide() {
  const res = await fetch('/api/tide', { headers: authHeaders() })
  if (!res.ok) throw new Error('Tide alınamadı')
  return res.json()
}
