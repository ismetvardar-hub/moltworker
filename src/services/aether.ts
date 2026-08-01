import { authHeaders } from './auth'
export async function fetchAether() {
  const res = await fetch('/api/aether', { headers: authHeaders() })
  if (!res.ok) throw new Error('Aether alınamadı')
  return res.json()
}
