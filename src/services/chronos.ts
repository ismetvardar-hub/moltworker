import { authHeaders } from './auth'
export async function fetchChronos() {
  const res = await fetch('/api/chronos', { headers: authHeaders() })
  if (!res.ok) throw new Error('Chronos alınamadı')
  return res.json()
}
