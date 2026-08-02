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

async function post<T = unknown>(path: string, body: Record<string, unknown> = {}) {
  return parse<T>(
    await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function fetchEnergy(): Promise<{
  meters: Meter[]
  readings: EnergyReading[]
  flags?: unknown[]
  summary?: Record<string, unknown>
  summaryLines?: string[]
  title?: string
  spikes?: number
  missingReadings?: number
}> {
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

export async function runEnergySweep(body: Record<string, unknown> = {}) {
  return post('/api/energy/sweep', body)
}

export async function ackEnergyFlag(body: Record<string, unknown> = {}) {
  return post('/api/energy/flag/ack', body)
}

export async function recordEnergyReading(body: Record<string, unknown> = {}) {
  return post('/api/energy/reading', body)
}

export async function flagEnergySpike(body: Record<string, unknown> = {}) {
  return post('/api/energy/spike/flag', body)
}

export async function seedEnergyMeter(body: Record<string, unknown> = {}) {
  return post('/api/energy/meter/seed', body)
}
