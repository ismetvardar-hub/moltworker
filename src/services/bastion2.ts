import { authHeaders } from './auth'
export async function fetchBastion2() {
  const res = await fetch('/api/bastion2', { headers: authHeaders() })
  if (!res.ok) throw new Error('Bastion2 alınamadı')
  return res.json()
}
