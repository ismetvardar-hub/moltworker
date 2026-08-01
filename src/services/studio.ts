import { authHeaders } from './auth'
export async function fetchStudio() {
  const res = await fetch('/api/studio', { headers: authHeaders() })
  if (!res.ok) throw new Error('Studio alınamadı')
  return res.json()
}
