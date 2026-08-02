import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchMocktails(): Promise<any> {
  return parse(await fetch('/api/mocktails', { headers: authHeaders() }))
}
export async function createMocktails(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/mocktails', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchMocktails(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/mocktails/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postMocktails(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runMocktailsSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postMocktails('/api/mocktails/sweep', body)
}
export async function ackMocktailsFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postMocktails('/api/mocktails/flag/ack', body)
}
export async function markMocktailsRecipeGap(body: Record<string, unknown> = {}): Promise<any> {
  return postMocktails('/api/mocktails/recipe/gap', body)
}
export async function featureMocktailDrink(body: Record<string, unknown> = {}): Promise<any> {
  return postMocktails('/api/mocktails/feature', body)
}
export async function seedSunsetFlight(body: Record<string, unknown> = {}): Promise<any> {
  return postMocktails('/api/mocktails/sunset-flight/seed', body)
}
