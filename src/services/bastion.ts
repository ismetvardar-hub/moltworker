import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchBastion() {
  return parse(await fetch('/api/bastion', { headers: authHeaders() }))
}
export async function runBastionSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/bastion/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function closeBastionAccess(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/bastion/access/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function approveBastionRole(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/bastion/role/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function archiveBastionBreach(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/bastion/breach/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function ackBastionFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/bastion/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

