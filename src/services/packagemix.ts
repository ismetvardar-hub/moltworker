import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPackagemix(): Promise<any> {
  return parse(await fetch('/api/packagemix', { headers: authHeaders() }))
}
export async function createPackagemix(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/packagemix', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchPackagemix(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/packagemix/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
