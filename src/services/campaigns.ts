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

export async function fetchCampaigns(): Promise<{ campaigns: Campaign[]; active: number }> {
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
