import { authHeaders } from './auth'

export type Meter = { id: string; name: string; unit: string; venueId: string }
export type EnergyReading = {
  id: string
  meterId: string
  meterName: string
  value: number
  unit: string
  at: string
  actor: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchEnergy(): Promise<{ meters: Meter[]; readings: EnergyReading[] }> {
  return parse(await fetch('/api/energy', { headers: authHeaders() }))
}

export async function logEnergy(input: {
  meterId: string
  value: number
  note?: string
}): Promise<{ reading: EnergyReading }> {
  return parse(
    await fetch('/api/energy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}
