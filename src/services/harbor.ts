import { authHeaders } from './auth'
export async function fetchHarbor() {
  const res = await fetch('/api/harbor', { headers: authHeaders() })
  if (!res.ok) throw new Error('Harbor alınamadı')
  return res.json()
}
