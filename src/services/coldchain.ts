import { authHeaders } from './auth'

export type ColdAsset = {
  id: string
  name: string
  venueId: string
  minC: number
  maxC: number
}

export type ColdReading = {
  id: string
  assetId: string
  assetName: string
  tempC: number
  ok: boolean
  at: string
  actor: string
  note: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchColdchain(): Promise<{
  assets: ColdAsset[]
  readings: ColdReading[]
  recentAlerts: number
}> {
  return parse(await fetch('/api/coldchain', { headers: authHeaders() }))
}

export async function logCold(input: {
  assetId: string
  tempC: number
  note?: string
}): Promise<{ reading: ColdReading }> {
  return parse(
    await fetch('/api/coldchain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}
