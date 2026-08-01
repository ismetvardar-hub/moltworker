import { authHeaders } from './auth'
export async function fetchOdyssey() {
  const res = await fetch('/api/odyssey', { headers: authHeaders() })
  if (!res.ok) throw new Error('Odyssey alınamadı')
  return res.json()
}
