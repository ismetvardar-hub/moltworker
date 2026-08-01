import { authHeaders } from './auth'
export async function fetchHearth() {
  const res = await fetch('/api/hearth', { headers: authHeaders() })
  if (!res.ok) throw new Error('Hearth alınamadı')
  return res.json()
}
