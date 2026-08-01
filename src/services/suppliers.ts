import { authHeaders } from './auth'

export type Supplier = {
  id: string
  name: string
  category: string
  contact: string
  phone: string
  leadDays: number
  status: string
}

export type PurchaseLine = {
  sku: string
  name: string
  qty: number
  unit: string
  itemId?: string | null
}

export type PurchaseOrder = {
  id: string
  supplierId: string | null
  supplierName: string
  status: string
  lines: PurchaseLine[]
  note: string
  venueId?: string | null
  createdAt?: string
  receivedAt?: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchSuppliers(): Promise<{
  suppliers: Supplier[]
  orders: PurchaseOrder[]
  openOrders: number
}> {
  return parse(await fetch('/api/suppliers', { headers: authHeaders() }))
}

export async function createSupplier(input: Partial<Supplier> & { name: string }): Promise<{
  supplier: Supplier
}> {
  return parse(
    await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}

export async function createPurchaseOrder(input: {
  supplierId?: string
  lines: PurchaseLine[]
  note?: string
  venueId?: string
}): Promise<{ order: PurchaseOrder }> {
  return parse(
    await fetch('/api/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}

export async function receivePurchaseOrder(id: string): Promise<{ order: PurchaseOrder }> {
  return parse(
    await fetch(`/api/purchase-orders/${encodeURIComponent(id)}/receive`, {
      method: 'POST',
      headers: authHeaders(),
    }),
  )
}

export async function updatePurchaseOrder(
  id: string,
  patch: Partial<PurchaseOrder>,
): Promise<{ order: PurchaseOrder }> {
  return parse(
    await fetch(`/api/purchase-orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch),
    }),
  )
}
