import { authHeaders } from './auth'
export async function fetchCrucible2() {
  const res = await fetch('/api/crucible2', { headers: authHeaders() })
  if (!res.ok) throw new Error('Crucible2 alınamadı')
  return res.json()
}
