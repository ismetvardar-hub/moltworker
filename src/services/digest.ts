import { authHeaders } from './auth'
export async function fetchDigest() {
  const res = await fetch('/api/digest', { headers: authHeaders() })
  if (!res.ok) throw new Error('Digest alınamadı')
  return res.json()
}
