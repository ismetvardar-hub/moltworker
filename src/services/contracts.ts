import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchContracts(): Promise<any> {
  return parse(await fetch('/api/contracts', { headers: authHeaders() }))
}
export async function createContracts(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/contracts', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(input) }))
}
export async function patchContracts(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/contracts/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) }))
}

export async function runContractsSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/contracts/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackContractsFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/contracts/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function renewContractOps(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/contracts/renew', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function signContractOps(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/contracts/sign', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function seedRenewingContract(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/contracts/renewal/seed', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
