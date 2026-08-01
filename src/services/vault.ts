import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchVault() { return parse(await fetch('/api/vault', { headers: authHeaders() })) }
export async function runVaultSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/vault/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function healVaultTreasury(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/vault/treasury/heal', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeVaultAp(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/vault/ap/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function clearVaultRecon(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/vault/recon/clear', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackVaultFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/vault/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
