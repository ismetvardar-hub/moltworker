import { authHeaders } from './auth'
export async function fetchNightly() {
  const res = await fetch('/api/nightly', { headers: authHeaders() })
  if (!res.ok) throw new Error('Night audit alınamadı')
  return res.json()
}
