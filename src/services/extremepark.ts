import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchExtremeOverview() {
  return parse(await fetch('/api/extreme', { headers: authHeaders() }))
}

export async function fetchExtremeUserSpec(userId = 'guest_can') {
  return parse(
    await fetch(`/api/extreme/user-spec?user_id=${encodeURIComponent(userId)}`, {
      headers: authHeaders(),
    }),
  )
}

export async function signExtremeWaiver(body: Record<string, unknown>) {
  return parse(
    await fetch('/api/extreme/waiver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function runExtremeWeatherCheck(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/extreme/slot-weather-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function createExtremeMaas(body: Record<string, unknown>) {
  return parse(
    await fetch('/api/extreme/maas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function extremeWalletSpend(body: Record<string, unknown>) {
  return parse(
    await fetch('/api/extreme/wallet/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function patchExtremeGear(id: string, patch: Record<string, unknown>) {
  return parse(
    await fetch(`/api/extreme/gear/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch),
    }),
  )
}
