import { authHeaders } from './auth'
export async function fetchCrucible() {
  const res = await fetch('/api/crucible', { headers: authHeaders() })
  if (!res.ok) throw new Error('Crucible alınamadı')
  return res.json()
}
