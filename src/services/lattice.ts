import { authHeaders } from './auth'
export async function fetchLattice() {
  const res = await fetch('/api/lattice', { headers: authHeaders() })
  if (!res.ok) throw new Error('Lattice alınamadı')
  return res.json()
}
