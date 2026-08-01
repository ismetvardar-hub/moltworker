import { authHeaders } from './auth'
export async function fetchSentinel() {
  const res = await fetch('/api/sentinel', { headers: authHeaders() })
  if (!res.ok) throw new Error('Sentinel alınamadı')
  return res.json()
}
