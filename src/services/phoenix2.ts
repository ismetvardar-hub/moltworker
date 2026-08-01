import { authHeaders } from './auth'
export async function fetchPhoenix2() {
  const res = await fetch('/api/phoenix2', { headers: authHeaders() })
  if (!res.ok) throw new Error('Phoenix2 alınamadı')
  return res.json()
}
