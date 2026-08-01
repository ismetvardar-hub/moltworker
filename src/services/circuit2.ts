import { authHeaders } from './auth'
export async function fetchCircuit2() {
  const res = await fetch('/api/circuit2', { headers: authHeaders() })
  if (!res.ok) throw new Error('Circuit2 alınamadı')
  return res.json()
}
