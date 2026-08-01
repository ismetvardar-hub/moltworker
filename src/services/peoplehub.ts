import { authHeaders } from './auth'
export async function fetchPeoplehub() {
  const res = await fetch('/api/peoplehub', { headers: authHeaders() })
  if (!res.ok) throw new Error('People hub alınamadı')
  return res.json()
}
