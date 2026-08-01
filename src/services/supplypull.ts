import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchSupplypull(): Promise<any> {
  return parse(await fetch('/api/supplypull', { headers: authHeaders() }))
}
export async function createSupplypull(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/supplypull', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchSupplypull(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/supplypull/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
