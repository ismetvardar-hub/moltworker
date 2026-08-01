import { authHeaders } from './auth'
export async function fetchBastion() {
  const res = await fetch('/api/bastion', { headers: authHeaders() })
  if (!res.ok) throw new Error('Bastion alınamadı')
  return res.json()
}
