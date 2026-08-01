import { authHeaders } from './auth'
export async function fetchCharter() {
  const res = await fetch('/api/charter', { headers: authHeaders() })
  if (!res.ok) throw new Error('Charter alınamadı')
  return res.json()
}
