import { authHeaders } from './auth'
export async function fetchPyramid() {
  const res = await fetch('/api/pyramid', { headers: authHeaders() })
  if (!res.ok) throw new Error('Pyramid alınamadı')
  return res.json()
}
