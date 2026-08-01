import { authHeaders } from './auth'
export async function fetchArtery2() {
  const res = await fetch('/api/artery2', { headers: authHeaders() })
  if (!res.ok) throw new Error('Artery2 alınamadı')
  return res.json()
}
