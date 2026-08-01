import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchGreenPulse() {
  return parse(await fetch('/api/greenpulse', { headers: authHeaders() }))
}
export async function recordGreenMeter(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/greenpulse/meter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function addGreenIncident(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/greenpulse/incident', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function runGreenPulseAutomations(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/greenpulse/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
