import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchCrudopsRegistry() {
  return parse(await fetch('/api/crudops', { headers: authHeaders() }))
}

export async function fetchCrudDomainOps(domain: string) {
  return parse(await fetch(`/api/${encodeURIComponent(domain)}/ops`, { headers: authHeaders() }))
}

export async function runCrudDomainSweep(domain: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(`/api/${encodeURIComponent(domain)}/sweep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}

export async function ackCrudDomainFlag(domain: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(`/api/${encodeURIComponent(domain)}/flag/ack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}

export async function advanceCrudDomain(domain: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(`/api/${encodeURIComponent(domain)}/advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}

export async function healCrudDomain(domain: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(`/api/${encodeURIComponent(domain)}/heal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}

export async function seedCrudDomain(domain: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(`/api/${encodeURIComponent(domain)}/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}
