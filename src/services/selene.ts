import { authHeaders } from './auth'
export async function fetchSelene() {
  const res = await fetch('/api/selene', { headers: authHeaders() })
  if (!res.ok) throw new Error('Selene alınamadı')
  return res.json()
}
