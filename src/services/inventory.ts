import { authHeaders } from './auth'

export type StockItem = {
  id: string
  sku: string
  name: string
  unit: string
  qty: number
  minQty: number
  venueId: string
  brandId?: string
  low?: boolean
  quarantined?: boolean
  updatedAt?: string
}

export type StockMovement = {
  id: string
  itemId: string
  sku?: string
  delta: number
  qty?: number
  reason: string
  actor: string
  at: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function listInventory(): Promise<{
  items: StockItem[]
  lowStock: StockItem[]
  movements: StockMovement[]
  flags?: any[]
  summary?: any
  summaryLines?: string[]
  title?: string
}> {
  const data = await parse<{
    items?: StockItem[]
    movements?: StockMovement[]
    flags?: any[]
    summary?: any
    summaryLines?: string[]
    title?: string
  }>(await fetch('/api/inventory', { headers: authHeaders() }))
  const items = data.items ?? []
  return {
    items,
    lowStock: items.filter((i) => i.low || i.qty <= i.minQty),
    movements: data.movements ?? [],
    flags: data.flags,
    summary: data.summary,
    summaryLines: data.summaryLines,
    title: data.title,
  }
}

export async function adjustStock(input: {
  id: string
  delta: number
  reason?: string
}): Promise<{ item: StockItem; movement: StockMovement }> {
  return parse(
    await fetch('/api/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}

export async function runInventorySweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/inventory/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function ackInventoryFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/inventory/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function restockInventoryLows(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/inventory/lows/restock', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function quarantineInventorySku(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/inventory/sku/quarantine', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}

export async function receiveInventoryDelivery(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/inventory/delivery/receive', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
