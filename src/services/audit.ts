import { authHeaders } from './auth'

export type AuditEntry = {
  id?: string
  at: string
  actor: string
  action: string
  detail: string
  meta?: Record<string, unknown>
}

export async function fetchAudit(limit = 80): Promise<{ entries: AuditEntry[] }> {
  const res = await fetch(`/api/audit?limit=${limit}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Audit alınamadı')
  return (await res.json()) as { entries: AuditEntry[] }
}
