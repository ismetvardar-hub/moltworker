import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchRetail(): Promise<any> {
  return parse(await fetch('/api/retail', { headers: authHeaders() }))
}
export async function createRetail(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/retail', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchRetail(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/retail/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runRetailSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/retail/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackRetailFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/retail/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markRetailLowStockSku(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/retail/sku/low-stock', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function restockRetailSku(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/retail/restock', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedFlashSale(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/retail/flash-sale/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
