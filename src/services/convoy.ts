import { authHeaders } from './auth'
export async function fetchConvoy() {
  const res = await fetch('/api/convoy', { headers: authHeaders() })
  if (!res.ok) throw new Error('Convoy alınamadı')
  return res.json()
}
