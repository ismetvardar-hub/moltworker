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

export async function fetchRecipes(): Promise<{ recipes: Recipe[]; total: number }> {
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
