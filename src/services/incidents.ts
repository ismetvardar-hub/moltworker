import { authHeaders } from './auth'

export type Incident = {
  id: string
  source: string
  severity: string
  title: string
  detail: string
  status: string
  at: string
  ackedBy?: string
  ackedAt?: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchIncidents(): Promise<{
  incidents: Incident[]
  open: number
  critical: number
  bySource: Record<string, number>
  flags?: any[]
  summary?: any
  summaryLines?: string[]
  title?: string
}> {
  return parse(await fetch('/api/incidents', { headers: authHeaders() }))
}

export async function createIncident(input: {
  title: string
  detail?: string
  severity?: string
}): Promise<{ incident: Incident }> {
  return parse(
    await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}

export async function ackIncident(
  id: string,
  status: 'acked' | 'resolved' = 'acked',
): Promise<{ incident: Incident }> {
  return parse(
    await fetch(`/api/incidents/${encodeURIComponent(id)}/ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status }),
    }),
  )
}

export async function runIncidentsSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/incidents/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackIncidentsFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/incidents/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackOpenCriticalIncidents(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/incidents/critical/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function resolveOpenIncidents(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/incidents/open/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function escalateIncidentSeverity(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/incidents/severity/escalate', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
