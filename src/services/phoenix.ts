import { authHeaders } from './auth'
export async function fetchPhoenix() {
  const res = await fetch('/api/phoenix', { headers: authHeaders() })
  if (!res.ok) throw new Error('Phoenix alınamadı')
  return res.json()
}
