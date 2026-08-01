import { authHeaders } from './auth'
export async function fetchHelios() {
  const res = await fetch('/api/helios', { headers: authHeaders() })
  if (!res.ok) throw new Error('Helios alınamadı')
  return res.json()
}
