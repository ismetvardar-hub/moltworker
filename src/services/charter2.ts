import { authHeaders } from './auth'
export async function fetchCharter2() {
  const res = await fetch('/api/charter2', { headers: authHeaders() })
  if (!res.ok) throw new Error('Charter2 alınamadı')
  return res.json()
}
