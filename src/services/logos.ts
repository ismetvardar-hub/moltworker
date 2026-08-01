import { authHeaders } from './auth'
export async function fetchLogos() {
  const res = await fetch('/api/logos', { headers: authHeaders() })
  if (!res.ok) throw new Error('Logos alınamadı')
  return res.json()
}
