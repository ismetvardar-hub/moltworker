import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchBiosurvey(): Promise<any> {
  return parse(await fetch('/api/biosurvey', { headers: authHeaders() }))
}
export async function createBiosurvey(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/biosurvey', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchBiosurvey(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/biosurvey/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
