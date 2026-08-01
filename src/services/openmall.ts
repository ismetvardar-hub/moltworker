import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchOpenMall() {
  return parse(await fetch('/api/openmall', { headers: authHeaders() }))
}

export async function recordMallSale(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/openmall/sale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function mallDayRollup() {
  return parse(
    await fetch('/api/openmall/day-rollup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: '{}',
    }),
  )
}

