import { authHeaders } from './auth'
export async function fetchArtery() {
  const res = await fetch('/api/artery', { headers: authHeaders() })
  if (!res.ok) throw new Error('Artery alınamadı')
  return res.json()
}
