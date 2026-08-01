import { authHeaders } from './auth'
export async function fetchHorizon() {
  const res = await fetch('/api/horizon', { headers: authHeaders() })
  if (!res.ok) throw new Error('Horizon alınamadı')
  return res.json()
}
