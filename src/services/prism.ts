import { authHeaders } from './auth'
export async function fetchPrism() {
  const res = await fetch('/api/prism', { headers: authHeaders() })
  if (!res.ok) throw new Error('Prism alınamadı')
  return res.json()
}
