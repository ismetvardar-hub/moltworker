import { authHeaders } from './auth'
export async function fetchEmpire() {
  const res = await fetch('/api/empire', { headers: authHeaders() })
  if (!res.ok) throw new Error('Empire alınamadı')
  return res.json()
}
