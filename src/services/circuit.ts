import { authHeaders } from './auth'
export async function fetchCircuit() {
  const res = await fetch('/api/circuit', { headers: authHeaders() })
  if (!res.ok) throw new Error('Circuit alınamadı')
  return res.json()
}
