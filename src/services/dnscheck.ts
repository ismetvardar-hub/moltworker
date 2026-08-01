import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchDnscheck(): Promise<any> {
  return parse(await fetch('/api/dnscheck', { headers: authHeaders() }))
}
export async function createDnscheck(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/dnscheck', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchDnscheck(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/dnscheck/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
