import { authHeaders } from './auth'

export type Recipe = {
  id: string
  name: string
  venueId: string | null
  brandId?: string
  prepMinutes: number
  ingredients: { itemId?: string; name: string; qty: number }[]
  steps: string[]
  status: string
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

export async function fetchRecipes(): Promise<{
  recipes: Recipe[]
  total: number
  active?: number
  missingIngredients?: number
  staleCosts?: number
  flags?: unknown[]
  summary?: Record<string, unknown>
  summaryLines?: string[]
  title?: string
}> {
  return parse(await fetch('/api/recipes', { headers: authHeaders() }))
}

export async function createRecipe(input: Partial<Recipe> & { name: string }): Promise<{ recipe: Recipe }> {
  return parse(
    await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}

export async function cookRecipe(id: string, portions = 1): Promise<{ portions: number; movements: unknown[] }> {
  return parse(
    await fetch(`/api/recipes/${encodeURIComponent(id)}/cook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ portions }),
    }),
  )
}

export async function runRecipesSweep(body: Record<string, unknown> = {}) {
  return post('/api/recipes/sweep', body)
}

export async function ackRecipesFlag(body: Record<string, unknown> = {}) {
  return post('/api/recipes/flag/ack', body)
}

export async function cookRecipeOps(body: Record<string, unknown> = {}) {
  return post('/api/recipes/cook', body)
}

export async function flagMissingRecipeStock(body: Record<string, unknown> = {}) {
  return post('/api/recipes/stock/flag', body)
}

export async function refreshRecipeCosts(body: Record<string, unknown> = {}) {
  return post('/api/recipes/cost/refresh', body)
}
