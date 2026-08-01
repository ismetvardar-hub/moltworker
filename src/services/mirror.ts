import { authHeaders } from './auth'
export async function fetchMirror() {
  const res = await fetch('/api/mirror', { headers: authHeaders() })
  if (!res.ok) throw new Error('Mirror alınamadı')
  return res.json()
}
