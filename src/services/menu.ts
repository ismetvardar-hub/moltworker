import { authHeaders } from './auth'

export type MenuItem = {
  id: string
  name: string
  category: string
  price: number
  currency: string
  venueId: string | null
  recipeId: string | null
  available: boolean
  tags: string[]
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchMenu(): Promise<{ items: MenuItem[]; available: number; avgPrice: number }> {
  return parse(await fetch('/api/menu', { headers: authHeaders() }))
}

export async function createMenuItem(input: Partial<MenuItem> & { name: string }): Promise<{ item: MenuItem }> {
  return parse(
    await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}

export async function updateMenuItem(id: string, patch: Partial<MenuItem>): Promise<{ item: MenuItem }> {
  return parse(
    await fetch(`/api/menu/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch),
    }),
  )
}
