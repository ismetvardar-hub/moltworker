import { authHeaders } from './auth'
export async function fetchEcosphere() {
  const res = await fetch('/api/ecosphere', { headers: authHeaders() })
  if (!res.ok) throw new Error('Ecosphere alınamadı')
  return res.json()
}
