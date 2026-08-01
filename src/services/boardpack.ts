import { authHeaders } from './auth'
export async function fetchBoardpack() {
  const res = await fetch('/api/boardpack', { headers: authHeaders() })
  if (!res.ok) throw new Error('Board pack alınamadı')
  return res.json()
}
