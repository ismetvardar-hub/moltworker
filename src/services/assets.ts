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

export async function fetchAssets(): Promise<{ assets: Asset[]; online: number; maintenance: number }> {
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
