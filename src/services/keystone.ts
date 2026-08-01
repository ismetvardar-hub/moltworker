import { authHeaders } from './auth'
export async function fetchKeystone() {
  const res = await fetch('/api/keystone', { headers: authHeaders() })
  if (!res.ok) throw new Error('Keystone alınamadı')
  return res.json()
}
