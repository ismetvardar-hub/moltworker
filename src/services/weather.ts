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
