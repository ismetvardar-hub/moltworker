import { authHeaders } from './auth'
export async function fetchLinen() {
  const res = await fetch('/api/linen', { headers: authHeaders() })
  if (!res.ok) throw new Error('Linen alınamadı')
  return res.json()
}
