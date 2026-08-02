import { authHeaders } from './auth'

export type Campaign = {
  id: string
  name: string
  code: string
  discountPct: number
  brandId: string
  venueId: string | null
  startDate: string
  endDate: string
  status: string
  note: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

async function post<T = unknown>(path: string, body: Record<string, unknown> = {}) {
  return parse<T>(
    await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function fetchCampaigns(): Promise<{
  campaigns: Campaign[]
  active: number
  expired?: number
  endingSoon?: number
  flags?: unknown[]
  summary?: Record<string, unknown>
  summaryLines?: string[]
  title?: string
}> {
  return parse(await fetch('/api/campaigns', { headers: authHeaders() }))
}

export async function createCampaign(input: Partial<Campaign> & { name: string }): Promise<{ campaign: Campaign }> {
  return parse(
    await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}

export async function updateCampaign(id: string, patch: Partial<Campaign>): Promise<{ campaign: Campaign }> {
  return parse(
    await fetch(`/api/campaigns/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch),
    }),
  )
}

export async function runCampaignsSweep(body: Record<string, unknown> = {}) {
  return post('/api/campaigns/sweep', body)
}

export async function ackCampaignsFlag(body: Record<string, unknown> = {}) {
  return post('/api/campaigns/flag/ack', body)
}

export async function activateCampaignOps(body: Record<string, unknown> = {}) {
  return post('/api/campaigns/activate', body)
}

export async function expireCampaignOps(body: Record<string, unknown> = {}) {
  return post('/api/campaigns/expire', body)
}

export async function seedEndingSoonCampaign(body: Record<string, unknown> = {}) {
  return post('/api/campaigns/ending-soon/seed', body)
}
