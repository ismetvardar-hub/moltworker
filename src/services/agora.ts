import { authHeaders } from './auth'
export async function fetchAgora() {
  const res = await fetch('/api/agora', { headers: authHeaders() })
  if (!res.ok) throw new Error('Agora alınamadı')
  return res.json()
}
