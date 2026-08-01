import { authHeaders } from './auth'
export async function fetchSignalhub() {
  const res = await fetch('/api/signalhub', { headers: authHeaders() })
  if (!res.ok) throw new Error('Signal hub alınamadı')
  return res.json()
}
