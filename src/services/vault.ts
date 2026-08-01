import { authHeaders } from './auth'
export async function fetchVault() {
  const res = await fetch('/api/vault', { headers: authHeaders() })
  if (!res.ok) throw new Error('Vault alınamadı')
  return res.json()
}
