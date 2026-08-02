import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchDocuments(): Promise<any> {
  return parse(await fetch('/api/documents', { headers: authHeaders() }))
}

export async function createDocuments(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  }))
}

export async function runDocumentsSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/documents/sweep', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}

export async function ackDocumentsFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/documents/flag/ack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}

export async function reviseDocumentVersion(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/documents/revise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}

export async function flagDocumentReview(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/documents/review/flag', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}

export async function seedPolicyDocument(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/documents/policy/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  }))
}





