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
  featured?: boolean
  unavailableReason?: string
  tags: string[]
}
export type MenuFlag = { id: string; key: string; level: string; text: string; status: string }

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

export async function fetchMenu(): Promise<{
  items: MenuItem[]
  available: number
  unavailable?: number
  orphanRecipe?: number
  inactiveFeatured?: number
  avgPrice: number
  flags?: MenuFlag[]
  summary?: Record<string, unknown>
  summaryLines?: string[]
  title?: string
}> {
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

export async function runMenuSweep(body: Record<string, unknown> = {}) {
  return post('/api/menu/sweep', body)
}

export async function ackMenuFlag(body: Record<string, unknown> = {}) {
  return post('/api/menu/flag/ack', body)
}

export async function markMenuItemUnavailable(body: Record<string, unknown> = {}) {
  return post('/api/menu/unavailable/mark', body)
}

export async function repairMenuRecipeLinks(body: Record<string, unknown> = {}) {
  return post('/api/menu/recipe-links/repair', body)
}

export async function featureMenuItem(body: Record<string, unknown> = {}) {
  return post('/api/menu/feature', body)
}
