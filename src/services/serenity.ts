import { authHeaders } from './auth'
export async function fetchSerenity() {
  const res = await fetch('/api/serenity', { headers: authHeaders() })
  if (!res.ok) throw new Error('Serenity alınamadı')
  return res.json()
}
