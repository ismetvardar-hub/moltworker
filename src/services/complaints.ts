import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

async function post(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}

export async function fetchComplaints(): Promise<any> {
  return parse(await fetch('/api/complaints', { headers: authHeaders() }))
}

export async function createComplaints(input: Record<string, unknown>): Promise<any> {
  return post('/api/complaints', input)
}

export async function patchComplaints(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/complaints/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch),
  }))
}

export async function runComplaintsSweep(body: Record<string, unknown> = {}) {
  return post('/api/complaints/sweep', body)
}

export async function ackComplaintsFlag(body: Record<string, unknown> = {}) {
  return post('/api/complaints/flag/ack', body)
}

export async function escalateComplaintOps(body: Record<string, unknown> = {}) {
  return post('/api/complaints/escalate', body)
}

export async function resolveComplaintOps(body: Record<string, unknown> = {}) {
  return post('/api/complaints/resolve', body)
}

export async function seedAgingOpenComplaint(body: Record<string, unknown> = {}) {
  return post('/api/complaints/aging/seed', body)
}




