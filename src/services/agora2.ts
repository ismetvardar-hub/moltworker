import { authHeaders } from './auth'
export async function fetchAgora2() {
  const res = await fetch('/api/agora2', { headers: authHeaders() })
  if (!res.ok) throw new Error('Agora2 alınamadı')
  return res.json()
}
