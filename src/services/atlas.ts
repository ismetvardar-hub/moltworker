import { authHeaders } from './auth'
export async function fetchAtlas() {
  const res = await fetch('/api/atlas', { headers: authHeaders() })
  if (!res.ok) throw new Error('Atlas alınamadı')
  return res.json()
}
