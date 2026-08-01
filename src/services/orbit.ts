import { authHeaders } from './auth'
export async function fetchOrbit() {
  const res = await fetch('/api/orbit', { headers: authHeaders() })
  if (!res.ok) throw new Error('Orbit alınamadı')
  return res.json()
}
