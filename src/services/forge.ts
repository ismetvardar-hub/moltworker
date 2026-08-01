import { authHeaders } from './auth'
export async function fetchForge() {
  const res = await fetch('/api/forge', { headers: authHeaders() })
  if (!res.ok) throw new Error('Forge alınamadı')
  return res.json()
}
