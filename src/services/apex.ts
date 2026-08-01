import { authHeaders } from './auth'
export async function fetchApex() {
  const res = await fetch('/api/apex', { headers: authHeaders() })
  if (!res.ok) throw new Error('Apex alınamadı')
  return res.json()
}
