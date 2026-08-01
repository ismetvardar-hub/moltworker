import { authHeaders } from './auth'
export async function fetchCrown() {
  const res = await fetch('/api/crown', { headers: authHeaders() })
  if (!res.ok) throw new Error('Crown alınamadı')
  return res.json()
}
