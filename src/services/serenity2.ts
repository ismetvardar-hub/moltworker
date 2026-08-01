import { authHeaders } from './auth'
export async function fetchSerenity2() {
  const res = await fetch('/api/serenity2', { headers: authHeaders() })
  if (!res.ok) throw new Error('Serenity2 alınamadı')
  return res.json()
}
