import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchWeather(): Promise<any> {
  return parse(await fetch('/api/weather', { headers: authHeaders() }))
}

export async function refreshWeather(): Promise<any> {
  return parse(await fetch('/api/weather/refresh', { method: 'POST', headers: authHeaders() }))
}

export async function runWeatherSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/weather/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackWeatherFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/weather/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function opsRefreshWeather(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/weather/ops/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function setWeatherAdvisoryHold(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/weather/advisory/hold', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackWeatherExtreme(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/weather/extreme/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
