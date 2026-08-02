import { authHeaders } from './auth'

export type Asset = {
  id: string
  name: string
  category: string
  venueId: string | null
  status: string
  serial: string
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

export async function fetchAssets(): Promise<{
  assets: Asset[]
  total: number
  online: number
  maintenance: number
  maintenanceDue?: number
  offline?: number
  missingAssignee?: number
  flags?: unknown[]
  summary?: Record<string, unknown>
  summaryLines?: string[]
  title?: string
}> {
  return parse(await fetch('/api/assets', { headers: authHeaders() }))
}

export async function createAsset(input: Partial<Asset> & { name: string }): Promise<{ asset: Asset }> {
  return parse(
    await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}

export async function updateAsset(id: string, patch: Partial<Asset>): Promise<{ asset: Asset }> {
  return parse(
    await fetch(`/api/assets/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch),
    }),
  )
}

export async function runAssetsSweep(body: Record<string, unknown> = {}) {
  return post('/api/assets/sweep', body)
}

export async function ackAssetsFlag(body: Record<string, unknown> = {}) {
  return post('/api/assets/flag/ack', body)
}

export async function scheduleAssetMaintenance(body: Record<string, unknown> = {}) {
  return post('/api/assets/maintenance/schedule', body)
}

export async function bringAssetOnline(body: Record<string, unknown> = {}) {
  return post('/api/assets/online', body)
}

export async function assignAssetOwner(body: Record<string, unknown> = {}) {
  return post('/api/assets/owner/assign', body)
}
